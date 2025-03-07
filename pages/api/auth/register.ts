import type { NextApiRequest, NextApiResponse } from 'next';
import bcrypt from 'bcryptjs';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method Not Allowed' });
  }

  try {
    // Connect to database
    await connectDB();
    console.log('Connected to database in register handler');

    const { name, email, password, promoCode } = req.body;

    // Basic validation
    if (!name || !email || !password) {
      return res.status(400).json({ success: false, message: 'Faltan campos obligatorios' });
    }

    console.log(`Registering user: ${email}`);

    // Check if email already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      console.log(`User already exists: ${email}`);
      return res.status(400).json({ success: false, message: 'Este email ya está registrado' });
    }

    // Hash the password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create user with proper schema fields
    const newUser = new User({
      email,
      name,
      password: hashedPassword,
      promoCode: promoCode || undefined,
      role: 'user', // Default role
      freeRafflesCount: 0,
      createdAt: new Date(),
      createdRaffles: [],
      participatingRaffles: []
    });

    // Save the user to the database
    const savedUser = await newUser.save();
    console.log(`User saved successfully: ${savedUser._id}`);

    // If user provided a promo code, check if it's valid and apply benefits
    if (promoCode) {
      console.log(`Checking promo code: ${promoCode}`);
      const promoOwner = await User.findOne({ promoCode });
      if (promoOwner) {
        // Update the new user to mark promo code as used
        console.log(`Promo code valid, owned by: ${promoOwner._id}`);
        newUser.promoCodeUsed = true;
        await newUser.save();

        // Update the promo code owner to give them free raffle credits
        await User.findByIdAndUpdate(promoOwner._id, {
          $inc: { freeRafflesCount: 1 }
        });
        console.log(`Credited free raffle to user: ${promoOwner._id}`);
      }
    }

    // Return success but don't include the password
    return res.status(201).json({
      success: true,
      message: 'Usuario creado correctamente',
      user: {
        id: savedUser._id,
        name: savedUser.name,
        email: savedUser.email,
        role: savedUser.role,
      },
    });
  } catch (error) {
    console.error('Registration error:', error);
    return res.status(500).json({
      success: false,
      message: 'Error al registrar usuario',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
