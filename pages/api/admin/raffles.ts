import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]';
import connectDB from '../../../lib/mongodb';
import Raffle from '../../../models/Raffle';
import User from '../../../models/User';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    // Check authentication and admin role
    const session = await getServerSession(req, res, authOptions);

    if (!session) {
      return res.status(401).json({ message: 'Not authenticated' });
    }

    // Get user from database to check role
    await connectDB();
    const user = await User.findOne({ email: session.user.email });

    if (!user || user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized' });
    }

    // Get all raffles with populated creator information
    const raffles = await Raffle.find({})
      .populate('creator', 'name email')
      .populate('soldTickets.buyer', 'name email')
      .sort({ createdAt: -1 });

    // Transform data for frontend to handle JSON serialization
    const serializedRaffles = raffles.map(raffle => {
      const raffleObj = raffle.toObject();
      
      // Convert dates to strings
      if (raffleObj.startDate) raffleObj.startDate = raffleObj.startDate.toISOString();
      if (raffleObj.endDate) raffleObj.endDate = raffleObj.endDate.toISOString();
      if (raffleObj.createdAt) raffleObj.createdAt = raffleObj.createdAt.toISOString();
      if (raffleObj.lotteryDetails?.date) raffleObj.lotteryDetails.date = raffleObj.lotteryDetails.date.toISOString();
      if (raffleObj.promotionEndDate) raffleObj.promotionEndDate = raffleObj.promotionEndDate.toISOString();
      
      // Prepare sold tickets
      if (raffleObj.soldTickets) {
        raffleObj.soldTickets = raffleObj.soldTickets.map((ticket: any) => ({
          ...ticket,
          purchaseDate: ticket.purchaseDate ? ticket.purchaseDate.toISOString() : null
        }));
      }
      
      return raffleObj;
    });

    return res.status(200).json(serializedRaffles);
  } catch (error) {
    console.error('Error fetching admin raffles:', error);
    return res.status(500).json({ message: 'Internal server error', error: String(error) });
  }
}