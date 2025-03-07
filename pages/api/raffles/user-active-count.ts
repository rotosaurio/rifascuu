import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import connectDB from '@/lib/mongodb';
import Raffle from '@/models/Raffle';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, message: 'Method Not Allowed' });
  }

  try {
    // Get session from NextAuth
    const session = await getServerSession(req, res, authOptions);

    if (!session || !session.user) {
      return res.status(401).json({ success: false, message: 'No estás autenticado' });
    }

    await connectDB();

    // Count active raffles for the current user
    const activeRafflesCount = await Raffle.countDocuments({
      creator: session.user.id,
      status: 'active'
    });

    return res.status(200).json({
      success: true,
      count: activeRafflesCount
    });
    
  } catch (error) {
    console.error('Error counting active raffles:', error);
    return res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'Error interno del servidor'
    });
  }
}
