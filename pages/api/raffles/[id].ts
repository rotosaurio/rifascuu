import type { NextApiRequest, NextApiResponse } from 'next';
import connectDB from '../../../lib/mongodb';
import Raffle from '../../../models/Raffle';
import User from '../../../models/User';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Método no permitido' });
  }

  try {
    const { id } = req.query;

    await connectDB();

    const raffle = await Raffle.findById(id)
      .populate('creator', 'name')
      .lean();

    if (!raffle) {
      return res.status(404).json({ message: 'Rifa no encontrada' });
    }

    res.status(200).json({ raffle });
  } catch (error) {
    console.error('Error al obtener rifa:', error);
    res.status(500).json({ message: 'Error al obtener la rifa' });
  }
} 