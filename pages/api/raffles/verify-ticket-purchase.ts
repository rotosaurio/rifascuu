import type { NextApiRequest, NextApiResponse } from 'next';
import Stripe from 'stripe';
import connectDB from '../../../lib/mongodb';
import Raffle from '../../../models/Raffle';
import User from '../../../models/User';
import { Types } from 'mongoose';

interface SoldTicket {
  number: number;
  buyer: Types.ObjectId;
  purchaseDate: Date;
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2022-11-15',
});

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Método no permitido' });
  }

  const { session_id } = req.query;

  if (!session_id) {
    return res.status(400).json({ message: 'ID de sesión requerido' });
  }

  try {
    const session = await stripe.checkout.sessions.retrieve(session_id as string);

    if (session.payment_status !== 'paid') {
      return res.status(200).json({ success: false });
    }

    await connectDB();

    const { raffleId, userId, tickets } = session.metadata!;
    const ticketNumbers = tickets.split(',').map(Number);

    // Verificar si los boletos ya fueron registrados
    const raffle = await Raffle.findById(raffleId);
    if (!raffle) {
      return res.status(404).json({ message: 'Rifa no encontrada' });
    }

    const soldTickets = new Set(raffle.soldTickets.map((ticket: SoldTicket) => ticket.number));
    const unavailableTickets = ticketNumbers.filter((ticketNumber: number) => soldTickets.has(ticketNumber));

    if (unavailableTickets.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Algunos boletos ya no están disponibles',
      });
    }

    // Registrar los boletos comprados
    await Raffle.findByIdAndUpdate(raffleId, {
      $push: {
        soldTickets: {
          $each: ticketNumbers.map((number: number) => ({
            number,
            buyer: userId,
            purchaseDate: new Date(),
          })),
        },
      },
    });

    // Actualizar el usuario
    await User.findByIdAndUpdate(userId, {
      $push: {
        participatingRaffles: {
          raffle: raffleId,
          tickets: ticketNumbers,
        },
      },
    });

    res.status(200).json({
      success: true,
      tickets: ticketNumbers,
    });
  } catch (error) {
    console.error('Error al verificar compra:', error);
    res.status(500).json({ message: 'Error al verificar la compra' });
  }
} 