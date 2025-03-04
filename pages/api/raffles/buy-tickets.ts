import type { NextApiRequest, NextApiResponse } from 'next';
import { getSession } from 'next-auth/react';
import connectDB from '../../../lib/mongodb';
import Raffle from '../../../models/Raffle';
import User from '../../../models/User';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-02-24.acacia',
});

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

    const { raffleId, tickets } = req.body;

    if (!raffleId || !tickets || !Array.isArray(tickets) || tickets.length === 0) {
      return res.status(400).json({ message: 'Datos inválidos' });
    }

    const raffle = await Raffle.findById(raffleId);
    if (!raffle) {
      return res.status(404).json({ message: 'Rifa no encontrada' });
    }

    if (raffle.status !== 'active') {
      return res.status(400).json({ message: 'La rifa no está activa' });
    }

    // Verificar que los boletos estén disponibles
    const soldTickets = new Set(raffle.soldTickets.map(t => t.number));
    const unavailableTickets = tickets.filter(t => soldTickets.has(t));
    if (unavailableTickets.length > 0) {
      return res.status(400).json({
        message: `Los siguientes boletos ya no están disponibles: ${unavailableTickets.join(', ')}`,
      });
    }

    // Calcular el total a pagar
    const totalAmount = tickets.length * raffle.ticketPrice;

    // Crear sesión de pago con Stripe
    const stripeSession = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'mxn',
            product_data: {
              name: `Boletos para: ${raffle.name}`,
              description: `${tickets.length} boleto(s): ${tickets.join(', ')}`,
            },
            unit_amount: Math.round(raffle.ticketPrice * 100), // Convertir a centavos
          },
          quantity: tickets.length,
        },
      ],
      mode: 'payment',
      success_url: `${process.env.NEXTAUTH_URL}/raffles/${raffleId}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXTAUTH_URL}/raffles/${raffleId}`,
      metadata: {
        raffleId,
        userId: session.user.id,
        tickets: tickets.join(','),
      },
    });

    res.status(200).json({
      url: stripeSession.url,
      sessionId: stripeSession.id,
    });
  } catch (error) {
    console.error('Error al comprar boletos:', error);
    res.status(500).json({ message: 'Error al procesar la compra' });
  }
} 