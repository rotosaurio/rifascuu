import { buffer } from 'micro';
import type { NextApiRequest, NextApiResponse } from 'next';
import Stripe from 'stripe';
import connectDB from '../../../lib/mongodb';
import Raffle from '../../../models/Raffle';
import User from '../../../models/User';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16',
});

export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Método no permitido' });
  }

  const buf = await buffer(req);
  const sig = req.headers['stripe-signature']!;

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      buf,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err) {
    console.error('Error al verificar webhook:', err);
    return res.status(400).json({ message: 'Error de webhook' });
  }

  // Manejar el evento de pago completado
  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session;

    try {
      await connectDB();

      const { raffleId, userId, tickets } = session.metadata!;
      const ticketNumbers = tickets.split(',').map(Number);

      // Verificar si los boletos ya fueron registrados
      const raffle = await Raffle.findById(raffleId);
      if (!raffle) {
        throw new Error('Rifa no encontrada');
      }

      const soldTickets = raffle.tickets.filter((t: number) => t !== 0);
      const unavailableTickets = ticketNumbers.filter(t => soldTickets.has(t));

      if (unavailableTickets.length > 0) {
        throw new Error('Algunos boletos ya no están disponibles');
      }

      // Registrar los boletos comprados
      await Raffle.findByIdAndUpdate(raffleId, {
        $push: {
          soldTickets: {
            $each: ticketNumbers.map(number => ({
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
    } catch (error) {
      console.error('Error al procesar el pago:', error);
      return res.status(500).json({ message: 'Error al procesar el pago' });
    }
  }

  res.status(200).json({ received: true });
} 