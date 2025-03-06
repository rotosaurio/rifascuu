import type { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import { customAlphabet } from 'nanoid';

// Create a custom ID generator with only uppercase letters and numbers
// Avoid confusing characters like O and 0, I and 1
const nanoid = customAlphabet('ABCDEFGHJKLMNPQRSTUVWXYZ23456789', 8);

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      message: 'Method Not Allowed',
    });
  }

  // Get the user session
  const session = await getServerSession(req, res, authOptions);

  // Check if user is authenticated
  if (!session || !session.user) {
    return res.status(401).json({
      success: false,
      message: 'No estás autenticado',
    });
  }

  try {
    // Connect to database
    await connectDB();

    // Find user
    const user = await User.findOne({ email: session.user.email });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Usuario no encontrado',
      });
    }

    // Check if user already has a promo code
    if (user.promoCode) {
      return res.status(200).json({
        success: true,
        message: 'Ya tienes un código de promoción',
        promoCode: user.promoCode,
      });
    }

    // Generate a unique promo code
    let promoCode;
    let isUnique = false;
    
    while (!isUnique) {
      promoCode = nanoid();
      // Check if this code already exists
      const existingCode = await User.findOne({ promoCode });
      if (!existingCode) {
        isUnique = true;
      }
    }

    // Update user with new promo code
    await User.findByIdAndUpdate(user._id, { promoCode });

    return res.status(200).json({
      success: true,
      message: 'Código de promoción generado correctamente',
      promoCode,
    });
  } catch (error) {
    console.error('Error generating promo code:', error);
    return res.status(500).json({
      success: false,
      message: 'Error al generar código de promoción',
    });
  }
}
