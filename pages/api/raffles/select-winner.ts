import type { NextApiRequest, NextApiResponse } from 'next';
import { getSession } from 'next-auth/react';
import connectDB from '../../../lib/mongodb';
import Raffle from '../../../models/Raffle';
import { Types } from 'mongoose';

interface SoldTicket {
  number: number;
  buyer: Types.ObjectId;
  purchaseDate: Date;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Método no permitido' });
  }

  try {
    const session = await getSession({ req });

    if (!session?.user?.id) {
      return res.status(401).json({ message: 'No autorizado' });
    }

    await connectDB();

    const { raffleId, manualWinnerTicket } = req.body;

    if (!raffleId) {
      return res.status(400).json({ message: 'ID de rifa requerido' });
    }

    const raffle = await Raffle.findById(raffleId);
    if (!raffle) {
      return res.status(404).json({ message: 'Rifa no encontrada' });
    }

    // Verificar que el usuario sea el creador de la rifa
    if (raffle.creator.toString() !== session.user.id) {
      return res.status(403).json({ message: 'No autorizado para seleccionar ganador' });
    }

    // Verificar que la rifa esté activa
    if (raffle.status !== 'active') {
      return res.status(400).json({ message: 'La rifa no está activa' });
    }

    // Verificar que haya boletos vendidos
    if (raffle.soldTickets.length === 0) {
      return res.status(400).json({ message: 'No hay boletos vendidos' });
    }

    // Determinar el método de selección
    const selectionMethod = raffle.winnerSelectionMethod || 'random';
    let winningTicket;

    // Selección según el método configurado
    switch (selectionMethod) {
      case 'random':
        // Método aleatorio (original)
        const randomIndex = Math.floor(Math.random() * raffle.soldTickets.length);
        winningTicket = raffle.soldTickets[randomIndex];
        break;

      case 'lottery':
        // Si no hay detalles de lotería, no se puede seleccionar un ganador
        if (!raffle.lotteryDetails || !raffle.lotteryDetails.drawNumber) {
          return res.status(400).json({ 
            message: 'No se han proporcionado detalles del sorteo de lotería' 
          });
        }
        
        // Implementar lógica basada en lotería
        // Aquí se podría implementar una lógica específica según el sorteo
        // Por simplicidad, usamos el número de sorteo como semilla para un número aleatorio
        const lotteryNumber = parseInt(raffle.lotteryDetails.drawNumber);
        const seed = isNaN(lotteryNumber) ? Date.now() : lotteryNumber;
        
        // Simulamos una selección "determinista" basada en la semilla
        const pseudoRandom = (seed % raffle.soldTickets.length);
        winningTicket = raffle.soldTickets[pseudoRandom];
        break;

      case 'manual':
        // Selección manual por el creador
        if (!manualWinnerTicket) {
          return res.status(400).json({ 
            message: 'Debes seleccionar manualmente un boleto ganador' 
          });
        }
        
        // Buscar el boleto seleccionado
        const ticketNumber = parseInt(manualWinnerTicket);
        winningTicket = raffle.soldTickets.find((ticket: SoldTicket) => ticket.number === ticketNumber);
        
        if (!winningTicket) {
          return res.status(400).json({ 
            message: 'El boleto seleccionado no existe o no ha sido vendido' 
          });
        }
        break;

      default:
        return res.status(400).json({ 
          message: 'Método de selección no válido' 
        });
    }

    // Actualizar la rifa con el ganador
    await Raffle.findByIdAndUpdate(raffleId, {
      status: 'completed',
      winner: winningTicket.buyer,
      winningTicket: winningTicket.number
    });

    res.status(200).json({
      success: true,
      winningTicket: {
        number: winningTicket.number,
        buyer: winningTicket.buyer,
      },
    });
  } catch (error) {
    console.error('Error al seleccionar ganador:', error);
    res.status(500).json({ message: 'Error al seleccionar el ganador' });
  }
} 