import type { NextApiRequest, NextApiResponse } from 'next';
import { getSession } from 'next-auth/react';
import connectDB from '../../../../lib/mongodb';
import Raffle from '../../../../models/Raffle';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'PUT') {
    return res.status(405).json({ message: 'Método no permitido' });
  }

  try {
    const session = await getSession({ req });
    
    if (!session) {
      return res.status(401).json({ message: 'No autorizado' });
    }

    const { id } = req.query;
    const { status } = req.body;

    await connectDB();

    const raffle = await Raffle.findById(id);
    if (!raffle) {
      return res.status(404).json({ message: 'Rifa no encontrada' });
    }

    // Verificar que el usuario sea el creador de la rifa
    if (raffle.creator.toString() !== session.user.id) {
      return res.status(403).json({ message: 'No autorizado para modificar esta rifa' });
    }

    // Si la rifa tiene boletos vendidos, no se puede borrar
    if (status === 'deleted' && raffle.soldTickets.length > 0) {
      return res.status(400).json({ 
        message: 'No se puede borrar una rifa que ya tiene boletos vendidos' 
      });
    }

    raffle.status = status;
    await raffle.save();

    res.status(200).json({ message: 'Estado de la rifa actualizado exitosamente' });
  } catch (error) {
    console.error('Error al actualizar estado de la rifa:', error);
    res.status(500).json({ message: 'Error al actualizar el estado de la rifa' });
  }
} 