import type { NextApiRequest, NextApiResponse } from 'next';
import { getSession } from 'next-auth/react';
import connectDB from '../../../lib/mongodb';
import Raffle from '../../../models/Raffle';
import User from '../../../models/User';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2022-11-15',
});

const calculatePrice = (totalTickets: number) => {
  let price = 0;
  
  if (totalTickets <= 100) {
    return 0; // Gratis hasta 100 boletos
  }

  if (totalTickets <= 10000) {
    price = Math.ceil(totalTickets / 10) * 1; // 1 peso por cada 10 boletos
  } else if (totalTickets <= 50000) {
    price = Math.ceil(totalTickets / 10) * 0.6; // 60 centavos por cada 10 boletos
  } else if (totalTickets <= 1000000) {
    price = Math.ceil(totalTickets / 10) * 0.35; // 35 centavos por cada 10 boletos
  } else {
    price = totalTickets * 0.01; // 1 centavo por boleto
  }

  return price;
};

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

    await connectDB();

    const {
      name,
      description,
      totalTickets,
      ticketPrice,
      images,
      contactInfo,
      isPromoted,
    } = req.body;

    // Validar campos requeridos
    if (!name || !description || !totalTickets || !ticketPrice || !contactInfo) {
      return res.status(400).json({ message: 'Todos los campos son requeridos' });
    }

    const user = await User.findById(session.user.id);
    if (!user) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }

    // Calcular precio total
    let totalPrice = calculatePrice(totalTickets);
    
    // Agregar costo de promoción si se solicita
    if (isPromoted) {
      totalPrice += 500; // 500 pesos por promoción mensual
    }

    if (totalPrice > 0) {
      // Crear sesión de pago con Stripe
      const stripeSession = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        line_items: [
          {
            price_data: {
              currency: 'mxn',
              product_data: {
                name: `Rifa: ${name}`,
                description: `${totalTickets} boletos${isPromoted ? ' + Promoción' : ''}`,
              },
              unit_amount: Math.round(totalPrice * 100), // Convertir a centavos
            },
            quantity: 1,
          },
        ],
        mode: 'payment',
        success_url: `${process.env.NEXTAUTH_URL}/raffles/success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${process.env.NEXTAUTH_URL}/raffles/create`,
        metadata: {
          userId: session.user.id,
          raffleName: name,
          totalTickets: totalTickets.toString(),
          ticketPrice: ticketPrice.toString(),
          isPromoted: isPromoted.toString(),
        },
      });

      return res.status(200).json({ 
        url: stripeSession.url,
        sessionId: stripeSession.id,
      });
    }

    // Si es gratis (menos de 100 boletos), crear la rifa directamente
    const raffle = await Raffle.create({
      name,
      description,
      totalTickets,
      ticketPrice,
      images: images || [],
      contactInfo,
      creator: session.user.id,
      isPromoted,
      promotionEndDate: isPromoted ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) : null,
    });

    // Actualizar usuario
    await User.findByIdAndUpdate(session.user.id, {
      $push: { createdRaffles: raffle._id },
    });

    res.status(201).json({ message: 'Rifa creada exitosamente', raffle });
  } catch (error) {
    console.error('Error al crear rifa:', error);
    res.status(500).json({ message: 'Error al crear la rifa' });
  }
} 