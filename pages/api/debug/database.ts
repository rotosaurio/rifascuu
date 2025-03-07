import type { NextApiRequest, NextApiResponse } from 'next';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import Raffle from '@/models/Raffle';

// This endpoint is for debugging only - should be disabled in production
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (process.env.NODE_ENV === 'production') {
    return res.status(404).json({ message: 'Not available in production' });
  }

  try {
    console.log('Testing database connection...');
    await connectDB();
    console.log('Database connection successful');

    // Count users and raffles
    const userCount = await User.countDocuments();
    const raffleCount = await Raffle.countDocuments();

    // Get a sample of users and raffles
    const users = await User.find()
      .select('_id name email role createdRaffles')
      .limit(10)
      .lean();
    
    const raffles = await Raffle.find()
      .select('_id title ticketPrice totalTickets creator status')
      .limit(10)
      .populate('creator', 'name email')
      .lean();

    return res.status(200).json({
      status: 'Connected',
      stats: {
        userCount,
        raffleCount
      },
      sampleData: {
        users,
        raffles
      }
    });
  } catch (error) {
    console.error('Database connection error:', error);
    return res.status(500).json({ 
      status: 'Error',
      message: 'Failed to connect to database',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
