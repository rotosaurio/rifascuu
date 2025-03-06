import type { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // Get the user session
  const session = await getServerSession(req, res, authOptions);

  // Check if user is authenticated
  if (!session || !session.user) {
    return res.status(401).json({
      success: false,
      message: 'No estás autenticado',
    });
  }

  // Connect to database
  await connectDB();

  // GET: Fetch user profile
  if (req.method === 'GET') {
    try {
      const user = await User.findOne({ email: session.user.email }).select('-password');
      
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'Usuario no encontrado',
        });
      }

      return res.status(200).json({
        success: true,
        user,
      });
    } catch (error) {
      console.error('Error fetching user profile:', error);
      return res.status(500).json({
        success: false,
        message: 'Error al obtener el perfil del usuario',
      });
    }
  }

  // PUT: Update user profile
  if (req.method === 'PUT') {
    try {
      const { name } = req.body;

      if (!name) {
        return res.status(400).json({
          success: false,
          message: 'El nombre es obligatorio',
        });
      }

      const updatedUser = await User.findOneAndUpdate(
        { email: session.user.email },
        { name },
        { new: true }
      ).select('-password');

      if (!updatedUser) {
        return res.status(404).json({
          success: false,
          message: 'Usuario no encontrado',
        });
      }

      return res.status(200).json({
        success: true,
        message: 'Perfil actualizado correctamente',
        user: updatedUser,
      });
    } catch (error) {
      console.error('Error updating user profile:', error);
      return res.status(500).json({
        success: false,
        message: 'Error al actualizar el perfil del usuario',
      });
    }
  }

  // Method not allowed
  return res.status(405).json({
    success: false,
    message: 'Method Not Allowed',
  });
}
