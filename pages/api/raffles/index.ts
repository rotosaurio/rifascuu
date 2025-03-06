import type { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import connectDB from '@/lib/mongodb';
import Raffle from '@/models/Raffle';
import User from '@/models/User';
import { parseForm } from '@/lib/parseForm';
import { uploadToCloudinary } from '@/lib/cloudinary';

export const config = {
  api: {
    bodyParser: false, // Disabling built-in bodyParser
  },
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    // Connect to database
    await connectDB();

    if (req.method === 'GET') {
      // Obtener las rifas activas
      const raffles = await Raffle.find({ 
        isActive: true,
        endDate: { $gt: new Date() }
      })
      .sort({ createdAt: -1 })
      .limit(12);
      
      // Responder con datos JSON
      return res.status(200).json({ raffles });
    } else {
      // Método no permitido
      return res.status(405).json({ message: 'Método no permitido' });
    }
  } catch (error) {
    console.error('Error en la API de rifas:', error);
    return res.status(500).json({ message: 'Error interno del servidor', error: error instanceof Error ? error.message : String(error) });
  }
}