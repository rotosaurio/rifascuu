import { NextApiRequest, NextApiResponse } from 'next';
import Stripe from 'stripe';
import connectDB from '../../../lib/mongodb';
import User from '../../../models/User';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16',
});

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { session_id } = req.query;

  if (!session_id || typeof session_id !== 'string') {
    return res.status(400).json({ error: 'Missing session_id' });
  }

  try {
    console.log('Verificando sesión de pago:', session_id);
    const session = await stripe.checkout.sessions.retrieve(session_id);
    console.log('Estado del pago:', session.payment_status);
    console.log('Metadata:', session.metadata);

    // Si el pago está completado, verificamos que la rifa se haya creado
    if (session.payment_status === 'paid') {
      await connectDB();
      
      if (session.metadata?.userId) {
        const user = await User.findById(session.metadata.userId);
        console.log('Usuario encontrado:', user?._id);
        
        if (user) {
          console.log('Detalles del usuario:');
          // Mostrar información más detallada para diagnóstico
          console.log('- Nombre:', user.name);
          console.log('- Email:', user.email);
          console.log('- Rol:', user.role);
          console.log('- Rifas creadas:', user.createdRaffles?.length || 0);
          console.log('- Imágenes temporales (raffleImageTemp):', user.raffleImageTemp?.length || 0);
          console.log('- Imágenes temporales (tempRaffleImages):', user.tempRaffleImages?.length || 0);
          
          // Verificar y mostrar información sobre las imágenes
          if (user.raffleImageTemp?.length > 0) {
            console.log('- Primera imagen en raffleImageTemp (longitud):', 
              user.raffleImageTemp[0]?.substring(0, 50) + '...');
          }
          
          if (user.tempRaffleImages?.length > 0) {
            console.log('- Primera imagen en tempRaffleImages:', 
              `Tipo: ${user.tempRaffleImages[0]?.contentType || 'desconocido'}, ` +
              `Longitud de datos: ${user.tempRaffleImages[0]?.data?.length || 0}`);
          }
        } else {
          console.warn('No se encontró el usuario con ID:', session.metadata.userId);
          console.warn('En modo desarrollo con MongoDB Memory Server, esto es esperado.');
        }
      }

      // Retornamos éxito independientemente de si el usuario existe o no
      // Ya que el webhook debería haber creado la rifa aún sin usuario
      return res.status(200).json({ 
        success: true,
        metadata: session.metadata
      });
    }

    // Si el pago está pendiente o falló
    return res.status(200).json({ 
      success: false,
      status: session.payment_status
    });
  } catch (error) {
    console.error('Error al verificar el pago:', error);
    return res.status(500).json({ 
      error: 'Error al verificar el pago',
      details: error instanceof Error ? error.message : 'Error desconocido'
    });
  }
}