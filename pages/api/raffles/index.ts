import type { NextApiRequest, NextApiResponse } from 'next';
import connectDB from '../../../lib/mongodb';
import Raffle from '../../../models/Raffle';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Método no permitido' });
  }

  try {
    await connectDB();

    const raffles = await Raffle.find({ status: 'active' })
      .sort({ isPromoted: -1, createdAt: -1 })
      .lean();

    res.status(200).json({ raffles });
  } catch (error) {
    console.error('Error al obtener rifas:', error);
    res.status(500).json({ message: 'Error al obtener las rifas' });
  }
} 