import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import Raffle from '@/models/Raffle';
import { IncomingForm } from 'formidable';
import { uploadToCloudinary } from '@/lib/cloudinary';
import { promises as fs } from 'fs';
import stripe from '@/lib/stripe';
import { Session } from 'next-auth';

// Define TypeScript interfaces for Cloudinary result
interface CloudinaryResult {
  secure_url: string;
  public_id: string;
  [key: string]: any;
}

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
    return res.status(405).json({ success: false, message: 'Method Not Allowed' });
  }

  try {
    // Get session from NextAuth
    const authSession = await getServerSession(req, res, authOptions);

    if (!authSession || !authSession.user) {
      return res.status(401).json({ success: false, message: 'No estás autenticado' });
    }

    await connectDB();

    // Parse form data
    const form = new IncomingForm({
      keepExtensions: true,
      maxFileSize: 10 * 1024 * 1024, // 10MB limit
    });

    const [fields, files] = await new Promise<[any, any]>((resolve, reject) => {
      form.parse(req, (err, fields, files) => {
        if (err) reject(err);
        resolve([fields, files]);
      });
    });

    console.log("Received fields:", Object.keys(fields));
    
    // Safely access form fields with null checks and default values
    const title = fields.title ? fields.title[0] : undefined;
    const description = fields.description ? fields.description[0] : undefined;
    const ticketPrice = fields.ticketPrice ? parseFloat(fields.ticketPrice[0]) : 0;
    const totalTickets = fields.totalTickets ? parseInt(fields.totalTickets[0]) : 0;
    const isPromoted = fields.isPromoted && fields.isPromoted[0] === 'true';
    const promotionMonths = fields.promotionMonths ? parseInt(fields.promotionMonths[0]) : 1;
    
    // Log received values for debugging
    console.log("Parsed field values:", {
      title,
      description,
      ticketPrice,
      totalTickets,
      isPromoted,
      promotionMonths
    });
    
    // Validate required fields with detailed error message
    const validationErrors = [];
    
    if (!title) validationErrors.push("Título faltante");
    if (!description) validationErrors.push("Descripción faltante");
    if (typeof ticketPrice !== 'number' || isNaN(ticketPrice) || ticketPrice <= 0) {
      validationErrors.push(`Precio de boleto inválido: ${fields.ticketPrice ? fields.ticketPrice[0] : 'no proporcionado'}`);
    }
    if (typeof totalTickets !== 'number' || isNaN(totalTickets) || totalTickets <= 0) {
      validationErrors.push(`Número de boletos inválido: ${fields.totalTickets ? fields.totalTickets[0] : 'no proporcionado'}`);
    }
    
    if (validationErrors.length > 0) {
      console.error("Validation failed:", validationErrors.join(", "));
      return res.status(400).json({ 
        success: false, 
        message: `Faltan campos requeridos o valores inválidos: ${validationErrors.join(", ")}`,
        validationErrors,
        received: {
          title: !!title,
          description: !!description,
          ticketPrice: typeof ticketPrice === 'number' && !isNaN(ticketPrice) && ticketPrice > 0,
          totalTickets: typeof totalTickets === 'number' && !isNaN(totalTickets) && totalTickets > 0,
        }
      });
    }

    // Now TypeScript knows these are valid numbers after the validation check above

    // Get user from database to access cloudinaryTempImages and check active raffles
    const user = await User.findById(authSession.user.id);

    if (!user) {
      return res.status(404).json({ success: false, message: 'Usuario no encontrado' });
    }

    // Prepare Cloudinary images array
    let cloudinaryImages = [];

    // Check if client sent Cloudinary images directly in the request
    if (fields.cloudinaryImages && fields.cloudinaryImages[0]) {
      try {
        const parsedImages = JSON.parse(fields.cloudinaryImages[0]);
        if (Array.isArray(parsedImages) && parsedImages.length > 0) {
          console.log(`Using ${parsedImages.length} pre-uploaded Cloudinary images from request`);
          cloudinaryImages = parsedImages;
        }
      } catch (err) {
        console.error('Failed to parse cloudinaryImages from form data:', err);
      }
    }

    // If no Cloudinary images in the request, check the user
    if (cloudinaryImages.length === 0 && user.cloudinaryTempImages && user.cloudinaryTempImages.length > 0) {
      console.log(`Using ${user.cloudinaryTempImages.length} pre-uploaded Cloudinary images from user`);
      cloudinaryImages = user.cloudinaryTempImages;
    }

    // If still no images, try to upload the files from the form
    if (cloudinaryImages.length === 0 && files.images) {
      const imageFiles = Array.isArray(files.images) ? files.images : [files.images];
      console.log(`Uploading ${imageFiles.length} new images to Cloudinary`);
      
      for (const file of imageFiles) {
        const fileContent = await fs.readFile(file.filepath);
        // Specify the return type for uploadToCloudinary
        const result = await uploadToCloudinary(fileContent) as CloudinaryResult;
        
        if (result && result.secure_url) {
          cloudinaryImages.push({
            url: result.secure_url,
            publicId: result.public_id,
          });
        }
        
        // Clean up temp file
        await fs.unlink(file.filepath).catch(err => console.error('Error deleting temp file:', err));
      }
    }
    
    // Log received data for debugging
    console.log("Form data validation:", {
      title: !!title,
      description: !!description,
      ticketPrice,
      totalTickets,
      cloudinaryImages: cloudinaryImages.length
    });

    if (cloudinaryImages.length === 0) {
      // For debugging purposes, check what's in the user's cloudinaryTempImages
      console.log("User's cloudinaryTempImages:", user.cloudinaryTempImages);
      
      return res.status(400).json({ 
        success: false, 
        message: 'No se pudieron procesar las imágenes. Por favor, sube al menos una imagen.',
        details: {
          filesReceived: files.images ? true : false,
          tempImagesAvailable: user.cloudinaryTempImages ? user.cloudinaryTempImages.length : 0
        }
      });
    }

    // Check if user is eligible for a free raffle (up to 100 tickets)
    let isFreeRaffle = false;
    
    if (totalTickets <= 100) {
      // Count user's active raffles
      const activeRafflesCount = await Raffle.countDocuments({
        creator: authSession.user.id,
        status: 'active'
      });
      
      // User is eligible for a free raffle if they have no active raffles
      isFreeRaffle = activeRafflesCount === 0;
      console.log(`User has ${activeRafflesCount} active raffles. Free raffle eligibility: ${isFreeRaffle}`);
    }

    // Parse social links if present - with null check
    const socialLinks = fields.socialLinks && fields.socialLinks[0] ? JSON.parse(fields.socialLinks[0]) : {};

    // Calculate commission price with new tiered pricing structure
    let ticketCommissionRate = 0;
    let commissionPerTenTickets = 0;
    
    // Calculate price per 10 tickets based on total ticket volume
    if (totalTickets <= 100) {
      commissionPerTenTickets = 1.00; // $1 per 10 tickets for small raffles
    } else if (totalTickets <= 1000) {
      commissionPerTenTickets = 0.80; // $0.80 per 10 tickets for medium raffles
    } else if (totalTickets <= 10000) {
      commissionPerTenTickets = 0.70; // $0.70 per 10 tickets for larger raffles
    } else if (totalTickets <= 50000) {
      commissionPerTenTickets = 0.50; // $0.50 per 10 tickets for very large raffles
    } else if (totalTickets <= 1000000) {
      commissionPerTenTickets = 0.30; // $0.30 per 10 tickets for massive raffles
    } else {
      // For extremely large raffles, charge per individual ticket
      ticketCommissionRate = 0.01; // $0.01 per ticket
    }
    
    // Calculate total ticket-based commission
    const ticketsInTens = Math.ceil(totalTickets / 10);
    const ticketBasedCommission = ticketCommissionRate > 0 
      ? totalTickets * ticketCommissionRate 
      : ticketsInTens * commissionPerTenTickets;
    
    // Fixed raffle creation fee
    const fixedRaffleFee = 20; // $20 MXN fixed fee for creating a raffle
    
    // Calculate promotion price
    const promotionPrice = isPromoted ? 500 * promotionMonths : 0; // 500 MXN per month for promotion
    
    // Calculate total price - free if eligible
    let totalPrice = fixedRaffleFee + ticketBasedCommission + promotionPrice;
    
    // Apply free raffle if eligible (set price to 0)
    if (isFreeRaffle) {
      totalPrice = 0;
    }
    
    console.log({
      fixedRaffleFee,
      ticketBasedCommission,
      promotionPrice,
      totalPrice,
      promotionMonths,
      isFreeRaffle
    });

    // Prepare raffle config with null checks
    const raffleConfig = {
      startDate: fields.startDate && fields.startDate[0] ? fields.startDate[0] : new Date().toISOString().split('T')[0],
      endDate: fields.endDate && fields.endDate[0] ? fields.endDate[0] : undefined,
      winnerSelectionMethod: fields.winnerSelectionMethod && fields.winnerSelectionMethod[0] ? 
        fields.winnerSelectionMethod[0] : 'random',
      lotteryDate: fields.lotteryDate && fields.lotteryDate[0] ? fields.lotteryDate[0] : undefined,
      lotteryDrawNumber: fields.lotteryDrawNumber && fields.lotteryDrawNumber[0] ? 
        fields.lotteryDrawNumber[0] : undefined
    };

    // If this is a free raffle, create it directly without Stripe payment
    if (isFreeRaffle) {
      try {
        const raffle = new Raffle({
          title,
          description,
          ticketPrice,
          totalTickets,
          socialLinks,
          creator: authSession.user.id,
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
            new Date(Date.now() + promotionMonths * 30 * 24 * 60 * 60 * 1000) : 
            undefined,
          createdAt: new Date(),
          soldTickets: [],
          isFreeRaffle: true // Mark as free raffle
        });

        // Save the raffle
        const savedRaffle = await raffle.save();
        
        // Update user's createdRaffles array
        await User.findByIdAndUpdate(authSession.user.id, {
          $push: { createdRaffles: savedRaffle._id },
          $set: { cloudinaryTempImages: [] } // Clear temp images
        });
        
        return res.status(200).json({
          success: true,
          message: '¡Rifa gratuita creada exitosamente!',
          raffle: {
            id: savedRaffle._id,
            title: savedRaffle.title
          },
          redirectTo: '/dashboard'
        });
      } catch (error) {
        console.error('Error creating free raffle:', error);
        return res.status(500).json({
          success: false,
          message: error instanceof Error ? error.message : 'Error al crear la rifa gratuita'
        });
      }
    }

    // Create Stripe checkout session - use a different name to avoid conflict
    const stripeSession = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'mxn',
            product_data: {
              name: isPromoted ? 'Rifa con promoción' : 'Rifa estándar',
              description: `Comisión por la rifa: ${title}`,
            },
            unit_amount: Math.round(totalPrice * 100), // Stripe uses cents
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${process.env.NEXT_PUBLIC_BASE_URL}/raffles/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_BASE_URL}/raffles/create`,
      metadata: {
        userId: authSession.user.id,
        title,
        description,
        ticketPrice: String(ticketPrice),
        totalTickets: String(totalTickets),
        isPromoted: String(isPromoted),
        promotionMonths: String(promotionMonths),
        socialLinks: JSON.stringify(socialLinks),
        raffleConfig: JSON.stringify(raffleConfig),
      },
    });

    // Clear temporary images from user since they will be attached to the raffle after payment
    await User.findByIdAndUpdate(authSession.user.id, { 
      $set: { cloudinaryTempImages: [] } 
    });

    res.status(200).json({
      success: true,
      message: 'Redirigiendo a la pasarela de pago',
      sessionId: stripeSession.id,
      url: stripeSession.url,
    });
    
  } catch (error) {
    console.error('Error creating raffle:', error);
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'Error al crear la rifa',
    });
  }
}