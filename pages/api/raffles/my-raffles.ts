import type { NextApiRequest, NextApiResponse } from 'next';
import { getSession } from 'next-auth/react';
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
    const session = await getSession({ req });

    if (!session?.user?.id) {
      return res.status(401).json({ message: 'No autorizado' });
    }

    await connectDB();

    const raffles = await Raffle.find({ creator: session.user.id })
      .sort({ createdAt: -1 })
      .lean();

    res.status(200).json({ raffles });
  } catch (error) {
    console.error('Error al obtener rifas:', error);
    res.status(500).json({ message: 'Error al obtener las rifas' });
  }
} 