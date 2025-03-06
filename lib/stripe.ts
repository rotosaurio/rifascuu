import Stripe from 'stripe';

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('Missing STRIPE_SECRET_KEY environment variable');
}

// Fix: Use a type assertion for the API version string
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2022-11-15' as Stripe.StripeConfig['apiVersion'], // Use TypeScript's supported version
});

export async function createCheckoutSession(params: {
  ticketCount: number;
  unitAmount: number;
  raffleId: string;
  raffleName: string;
  userId: string;
  customerEmail: string;
}) {
  const { ticketCount, unitAmount, raffleId, raffleName, userId, customerEmail } = params;

  const session = await stripe.checkout.sessions.create({
    payment_method_types: ['card'],
    line_items: [
      {
        price_data: {
          currency: 'mxn',
          product_data: {
            name: `Boletos para: ${raffleName}`,
            description: `${ticketCount} boleto(s) para la rifa`,
          },
          unit_amount: unitAmount * 100, // Stripe uses cents
        },
        quantity: ticketCount,
      },
    ],
    metadata: {
      raffleId,
      userId,
      ticketCount,
    },
    customer_email: customerEmail,
    mode: 'payment',
    success_url: `${process.env.NEXT_PUBLIC_BASE_URL}/rifas/pago-exitoso?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${process.env.NEXT_PUBLIC_BASE_URL}/rifas/${raffleId}`,
  });

  return { id: session.id, url: session.url };
}

export default stripe;
