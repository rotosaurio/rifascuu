import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth"; // Fixed import path
import connectDB from '@/lib/mongodb';
import User from '@/models/User';

// Generate a random alphanumeric code
function generatePromoCode(length: number = 8): string {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return result;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Allow GET (list promos) and POST (create promo)
  if (req.method !== 'GET' && req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    // Check authentication and admin role
    const session = await getServerSession(req, res, authOptions);

    if (!session) {
      return res.status(401).json({ message: 'Not authenticated' });
    }

    await connectDB();
    const adminUser = await User.findOne({ email: session.user.email });

    if (!adminUser || adminUser.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized' });
    }

    // Handle GET request - List all promo codes
    if (req.method === 'GET') {
      const usersWithPromoCodes = await User.find(
        { promoCode: { $exists: true, $ne: null } },
        'email name promoCode promoCodeUsed'
      );
      
      return res.status(200).json(usersWithPromoCodes);
    }
    
    // Handle POST request - Create new promo code
    if (req.method === 'POST') {
      const { email, freeRaffles = 1 } = req.body;
      
      if (!email) {
        return res.status(400).json({ message: 'Email is required' });
      }

      // Find user by email
      let user = await User.findOne({ email });
      
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }
      
      // Generate a unique promo code
      let promoCode;
      let isUnique = false;
      
      while (!isUnique) {
        promoCode = generatePromoCode();
        const existing = await User.findOne({ promoCode });
        if (!existing) {
          isUnique = true;
        }
      }
      
      // Update user with promo code and free raffles count
      user.promoCode = promoCode;
      user.freeRafflesCount = freeRaffles;
      user.promoCodeUsed = false;
      
      await user.save();
      
      return res.status(200).json({
        message: 'Promo code generated successfully',
        user: {
          email: user.email,
          name: user.name,
          promoCode: user.promoCode,
          freeRafflesCount: user.freeRafflesCount,
          promoCodeUsed: user.promoCodeUsed
        }
      });
    }
  } catch (error) {
    console.error('Error managing promo codes:', error);
    return res.status(500).json({ message: 'Internal server error', error: String(error) });
  }
}