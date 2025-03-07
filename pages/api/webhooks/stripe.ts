import { buffer } from 'micro';
import type { NextApiRequest, NextApiResponse } from 'next';
import Stripe from 'stripe';
import connectDB from '../../../lib/mongodb';
import Raffle from '../../../models/Raffle';
import User from '../../../models/User';
import { Types } from 'mongoose';

interface TempImage {
  data: string;
  contentType: string;
}

interface CloudinaryImage {
  url: string;
  publicId: string;
}

interface UserDocument {
  _id: Types.ObjectId;
  raffleImageTemp?: string[];
  tempRaffleImages?: Array<TempImage>;
  cloudinaryTempImages?: Array<CloudinaryImage>;
  createdRaffles: Types.ObjectId[];
}

interface RaffleConfig {
  startDate?: string;
  endDate?: string;
  winnerSelectionMethod?: string;
  lotteryDate?: string;
  lotteryDrawNumber?: string;
}

// Imagen Cloudinary por defecto
const DEFAULT_CLOUDINARY_IMAGE: CloudinaryImage = {
  url: 'https://res.cloudinary.com/demo/image/upload/v1312461204/sample.jpg',
  publicId: 'sample'
};

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16' as Stripe.StripeConfig['apiVersion'],
});

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  let event: Stripe.Event;
  
  try {
    const buf = await buffer(req);
    const sig = req.headers['stripe-signature'];

    if (!sig) {
      return res.status(400).json({ message: 'Missing Stripe signature' });
    }

    try {
      event = stripe.webhooks.constructEvent(buf, sig, webhookSecret);
    } catch (err) {
      console.error('Error verifying webhook signature:', err);
      return res.status(400).json({ message: 'Webhook verification error' });
    }

    console.log('Stripe webhook received:', event.type);

    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as Stripe.Checkout.Session;
      
      // Verify that metadata exists
      if (!session.metadata) {
        console.error('Session does not contain metadata');
        return res.status(400).json({ message: 'Session does not contain required metadata' });
      }
      
      const metadata = session.metadata;
      console.log('Metadata received:', metadata);

      try {
        // Connect to database
        await connectDB();
        console.log('Connected to database');

        // Find the user first
        const userId = metadata.userId;
        console.log(`Looking for user: ${userId}`);
        const user = await User.findById(userId);
        
        if (!user) {
          console.error(`User not found: ${userId}`);
          return res.status(404).json({ success: false, message: 'User not found' });
        }

        console.log(`Found user: ${user.email}`);
        
        // Prepare Cloudinary images array
        let cloudinaryImages = [];

        // Get cloudinary images from user
        if (user.cloudinaryTempImages && user.cloudinaryTempImages.length > 0) {
          console.log(`Using ${user.cloudinaryTempImages.length} pre-uploaded Cloudinary images`);
          cloudinaryImages = user.cloudinaryTempImages;
        } else {
          // Use default image if needed
          console.log('No images found, using default image');
          cloudinaryImages = [DEFAULT_CLOUDINARY_IMAGE];
        }

        // Parse necessary data
        const title = metadata.title;
        const description = metadata.description;
        const ticketPrice = parseFloat(metadata.ticketPrice);
        const totalTickets = parseInt(metadata.totalTickets);
        const isPromoted = metadata.isPromoted === 'true';
        const promotionMonths = parseInt(metadata.promotionMonths || '1');
        const socialLinks = JSON.parse(metadata.socialLinks || '{}');
        const raffleConfig = JSON.parse(metadata.raffleConfig || '{}');

        // Validate the parsed data
        if (isNaN(ticketPrice) || isNaN(totalTickets) || !title || !description) {
          console.error('Invalid raffle data:', { ticketPrice, totalTickets, title, description });
          return res.status(400).json({ success: false, message: 'Invalid raffle data in metadata' });
        }

        // Create the raffle
        console.log('Creating raffle with data:', { title, ticketPrice, totalTickets, promotionMonths });
        const raffle = new Raffle({
          title,
          description,
          ticketPrice,
          totalTickets,
          socialLinks,
          creator: userId,
          cloudinaryImages,
          isPromoted,
          status: 'active',
          startDate: raffleConfig.startDate ? new Date(raffleConfig.startDate) : new Date(),
          endDate: raffleConfig.endDate ? new Date(raffleConfig.endDate) : undefined,
          winnerSelectionMethod: raffleConfig.winnerSelectionMethod || 'random',
          lotteryDetails: raffleConfig.winnerSelectionMethod === 'lottery' ? {
            date: raffleConfig.lotteryDate ? new Date(raffleConfig.lotteryDate) : undefined,
            drawNumber: raffleConfig.lotteryDrawNumber
          } : undefined,
          promotionEndDate: isPromoted ? 
            new Date(Date.now() + promotionMonths * 30 * 24 * 60 * 60 * 1000) : // Calculate based on months
            undefined,
          createdAt: new Date(),
          soldTickets: []
        });

        // Save the raffle
        const savedRaffle = await raffle.save();
        console.log(`Raffle created successfully: ${savedRaffle._id}`);

        // Update user's createdRaffles array
        await User.findByIdAndUpdate(userId, {
          $push: { createdRaffles: savedRaffle._id },
          $set: { cloudinaryTempImages: [] } // Clear temp images
        });
        
        console.log(`Updated user's createdRaffles array`);
        
        return res.status(200).json({ received: true });
      } catch (error) {
        console.error('Error processing webhook:', error);
        return res.status(500).json({ message: 'Error processing webhook' });
      }
    }

    return res.status(200).json({ received: true });
  } catch (error) {
    console.error('Error processing webhook:', error);
    return res.status(500).json({ message: 'Error processing webhook' });
  }
}