import type { NextApiRequest, NextApiResponse } from 'next';
import { getSession } from 'next-auth/react';
import connectDB from '../../../lib/mongodb';
import Raffle from '../../../models/Raffle';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Método no permitido' });
  }

  try {
    const session = await getSession({ req });

    if (!session?.user?.id) {
      return res.status(401).json({ message: 'No autorizado' });
    }

    await connectDB();

    const { raffleId } = req.body;

    if (!raffleId) {
      return res.status(400).json({ message: 'ID de rifa requerido' });
    }

    const raffle = await Raffle.findById(raffleId);
    if (!raffle) {
      return res.status(404).json({ message: 'Rifa no encontrada' });
    }

    // Verificar que el usuario sea el creador de la rifa
    if (raffle.creator.toString() !== session.user.id) {
      return res.status(403).json({ message: 'No autorizado para seleccionar ganador' });
    }

    // Verificar que la rifa esté activa
    if (raffle.status !== 'active') {
      return res.status(400).json({ message: 'La rifa no está activa' });
    }

    // Verificar que haya boletos vendidos
    if (raffle.soldTickets.length === 0) {
      return res.status(400).json({ message: 'No hay boletos vendidos' });
    }

    // Seleccionar un boleto al azar
    const randomIndex = Math.floor(Math.random() * raffle.soldTickets.length);
    const winningTicket = raffle.soldTickets[randomIndex];

    // Actualizar la rifa con el ganador
    await Raffle.findByIdAndUpdate(raffleId, {
      status: 'completed',
      winner: winningTicket.buyer,
    });

    res.status(200).json({
      success: true,
      winningTicket: {
        number: winningTicket.number,
        buyer: winningTicket.buyer,
      },
    });
  } catch (error) {
    console.error('Error al seleccionar ganador:', error);
    res.status(500).json({ message: 'Error al seleccionar el ganador' });
  }
} 