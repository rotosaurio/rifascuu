import type { NextApiRequest, NextApiResponse } from 'next';
import Stripe from 'stripe';

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

    if (session.payment_status === 'paid') {
      return res.status(200).json({ success: true });
    } else {
      return res.status(200).json({ success: false });
    }
  } catch (error) {
    console.error('Error al verificar pago:', error);
    return res.status(500).json({ message: 'Error al verificar el pago' });
  }
} 