import type { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import bcrypt from 'bcryptjs';
// Fix the import path - try a relative path instead of the alias
import { authOptions } from '../../../lib/auth';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // Only allow PUT requests
  if (req.method !== 'PUT') {
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

    const { currentPassword, newPassword } = req.body;

    // Validate input
    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Ambas contraseñas son obligatorias',
      });
    }

    // Find user
    const user = await User.findOne({ email: session.user.email });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Usuario no encontrado',
      });
    }

    // Verify current password
    const isMatch = await bcrypt.compare(currentPassword, user.password);

    if (!isMatch) {
      return res.status(400).json({
        success: false,
        message: 'Contraseña actual incorrecta',
      });
    }

    // Hash new password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    // Update user's password
    await User.findByIdAndUpdate(user._id, { password: hashedPassword });

    return res.status(200).json({
      success: true,
      message: 'Contraseña actualizada correctamente',
    });
  } catch (error) {
    console.error('Error updating password:', error);
    return res.status(500).json({
      success: false,
      message: 'Error al actualizar la contraseña',
    });
  }
}
