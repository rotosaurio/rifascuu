import type { NextApiRequest, NextApiResponse } from 'next';
import { getSession } from 'next-auth/react';
import connectDB from '../../../lib/mongodb';
import User from '../../../models/User';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Método no permitido' });
  }

  try {
    const session = await getSession({ req });
    
    if (!session) {
      return res.status(401).json({ message: 'No autorizado' });
    }

    await connectDB();

    // Verificar que el usuario sea administrador
    const adminUser = await User.findById(session.user.id);
    if (!adminUser || adminUser.role !== 'admin') {
      return res.status(403).json({ message: 'Acceso denegado' });
    }

    const users = await User.find()
      .select('-password')
      .sort({ createdAt: -1 })
      .lean();

    res.status(200).json({ users });
  } catch (error) {
    console.error('Error al obtener usuarios:', error);
    res.status(500).json({ message: 'Error al obtener los usuarios' });
  }
} 