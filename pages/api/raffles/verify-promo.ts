import type { NextApiRequest, NextApiResponse } from 'next';
import { getSession } from 'next-auth/react';
import connectDB from '../../../lib/mongodb';
import User from '../../../models/User';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Método no permitido' });
  }

  try {
    const session = await getSession({ req });
    
    if (!session) {
      return res.status(401).json({ message: 'No autorizado' });
    }

    const { promoCode } = req.body;

    if (!promoCode) {
      return res.status(400).json({ message: 'Código promocional requerido' });
    }

    await connectDB();

    // Buscar el código promocional
    const promoUser = await User.findOne({ promoCode, promoCodeUsed: false });

    if (!promoUser) {
      return res.status(404).json({ message: 'Código promocional inválido o ya utilizado' });
    }

    // Marcar el código como usado
    await User.findByIdAndUpdate(promoUser._id, { promoCodeUsed: true });

    // Incrementar el contador de rifas gratuitas del usuario
    await User.findByIdAndUpdate(session.user.id, {
      $inc: { freeRafflesCount: 1 }
    });

    res.status(200).json({ 
      message: 'Código promocional aplicado correctamente',
      freeRaffle: true
    });
  } catch (error) {
    console.error('Error al verificar código promocional:', error);
    res.status(500).json({ message: 'Error al verificar el código promocional' });
  }
} 