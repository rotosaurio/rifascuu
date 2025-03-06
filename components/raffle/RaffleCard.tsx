import Link from 'next/link';
import Image from 'next/image';
import { formatCurrency, calculateProgress } from '@/lib/utils';

interface RaffleCardProps {
  raffle: {
    id: string;
    title: string;
    image: string;
    totalTickets: number;
    availableTickets: number;
    ticketPrice: number;
    discountedPrice?: number;
    drawDate: Date;
    prizeDescription: string;
    companyName?: string;
  };
}

export default function RaffleCard({ raffle }: RaffleCardProps) {
  const progress = calculateProgress(raffle.availableTickets, raffle.totalTickets);
  const isDiscounted = raffle.discountedPrice && raffle.discountedPrice < raffle.ticketPrice;
  
  return (
    <div className="bg-white rounded-lg overflow-hidden shadow-md hover:shadow-lg transition-shadow duration-300">
      <div className="relative h-48">
        <Image 
          src={raffle.image} 
          alt={raffle.title}
          className="object-cover"
          fill
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
        />
      </div>
      
      <div className="p-4">
        <h3 className="font-bold text-xl mb-2 truncate">{raffle.title}</h3>
        
        {raffle.companyName && (
          <p className="text-gray-600 text-sm mb-2">Por: {raffle.companyName}</p>
        )}
        
        <p className="text-gray-700 text-sm mb-3 line-clamp-2">{raffle.prizeDescription}</p>
        
        <div className="mb-3">
          <div className="flex justify-between text-sm mb-1">
            <span>Boletos vendidos</span>
            <span>{raffle.totalTickets - raffle.availableTickets} / {raffle.totalTickets}</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-blue-600 h-2 rounded-full" 
              style={{ width: `${progress}%` }}
            ></div>
          </div>
        </div>
        
        <div className="flex justify-between items-center mb-3">
          <div>
            <p className="text-sm text-gray-600">Precio por boleto:</p>
            <div className="flex items-center">
              {isDiscounted ? (
                <>
                  <span className="text-lg font-bold text-green-600">
                    {formatCurrency(raffle.discountedPrice || 0)}
                  </span>
                  <span className="text-sm text-gray-500 line-through ml-2">
                    {formatCurrency(raffle.ticketPrice)}
                  </span>
                </>
              ) : (
                <span className="text-lg font-bold">{formatCurrency(raffle.ticketPrice)}</span>
              )}
            </div>
          </div>
          
          <div className="text-right">
            <p className="text-xs text-gray-600">Fecha del sorteo:</p>
            <p className="text-sm font-semibold">
              {new Date(raffle.drawDate).toLocaleDateString()}
            </p>
          </div>
        </div>
        
        <Link 
          href={`/rifas/${raffle.id}`} 
          className="block w-full bg-blue-600 hover:bg-blue-700 text-white text-center py-2 rounded-md transition-colors"
        >
          Ver detalles
        </Link>
      </div>
    </div>
  );
}
