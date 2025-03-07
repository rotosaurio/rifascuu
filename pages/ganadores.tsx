import { useState, useEffect } from 'react';
import Head from 'next/head';
import Image from 'next/image';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/Card';
import Loading from '@/components/ui/Loading';

interface Winner {
  id: string;
  name: string;
  avatarUrl?: string;
  raffleId: string;
  raffleName: string;
  prize: string;
  ticketNumber: number;
  date: string;
  testimonial?: string;
}

export default function Ganadores() {
  const [winners, setWinners] = useState<Winner[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // In a real app, this would fetch from an API endpoint
    // Using placeholder data for demonstration purposes
    const fetchWinners = async () => {
      try {
        setLoading(true);
        
        // Simulated API call with setTimeout
        setTimeout(() => {
          setWinners([
            {
              id: '1',
              name: 'Juan Pérez',
              avatarUrl: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde',
              raffleId: 'r123',
              raffleName: 'iPhone 15 Pro Max',
              prize: 'iPhone 15 Pro Max 512GB',
              ticketNumber: 42,
              date: '2023-10-15',
              testimonial: '¡Nunca creí que ganaría! Estoy muy contento con mi nuevo iPhone.'
            },
            {
              id: '2',
              name: 'María González',
              avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330',
              raffleId: 'r456',
              raffleName: 'Viaje a Cancún',
              prize: 'Viaje todo incluido a Cancún para 2 personas',
              ticketNumber: 187,
              date: '2023-09-22',
              testimonial: 'Mi primera vez ganando algo, ¡no puedo esperar para ir a la playa!'
            },
            {
              id: '3',
              name: 'Roberto Sánchez',
              raffleId: 'r789',
              raffleName: 'PS5 + TV 4K',
              prize: 'PlayStation 5 + TV Samsung 55" 4K',
              ticketNumber: 95,
              date: '2023-08-30'
            },
            {
              id: '4',
              name: 'Ana Martínez',
              avatarUrl: 'https://images.unsplash.com/photo-1580489944761-15a19d654956',
              raffleId: 'r321',
              raffleName: 'Laptop Gaming',
              prize: 'Laptop Alienware m15 R7',
              ticketNumber: 231,
              date: '2023-08-05'
            }
          ]);
          setLoading(false);
        }, 1000);
        
      } catch (err) {
        setError('Error al cargar los ganadores');
        setLoading(false);
      }
    };

    fetchWinners();
  }, []);

  const formatDate = (dateString: string) => {
    const options: Intl.DateTimeFormatOptions = { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    };
    return new Date(dateString).toLocaleDateString('es-MX', options);
  };

  return (
    <>
      <Head>
        <title>Ganadores | RifasCUU</title>
        <meta name="description" content="Conoce a los afortunados ganadores de nuestras rifas." />
      </Head>

      <div className="min-h-screen py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-white mb-4">Ganadores Recientes</h1>
            <p className="text-xl text-white/90 max-w-2xl mx-auto">
              Conoce a las personas que ya ganaron en nuestras rifas. ¡El próximo podrías ser tú!
            </p>
          </div>

          {loading ? (
            <div className="flex justify-center py-12">
              <Loading color="white" size="lg" text="Cargando ganadores..." />
            </div>
          ) : error ? (
            <div className="bg-red-400/20 backdrop-blur-md border border-red-500 text-white px-6 py-4 rounded-xl">
              <p>{error}</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {winners.map((winner) => (
                <Card key={winner.id} className="bg-white/10 backdrop-blur-md border-none text-white overflow-hidden">
                  <CardContent className="p-0">
                    <div className="flex flex-col md:flex-row">
                      <div className="w-full md:w-1/3 bg-gradient-to-br from-yellow-400/20 to-red-600/20 p-6 flex flex-col items-center justify-center">
                        <div className="relative w-24 h-24 rounded-full overflow-hidden border-2 border-yellow-400 mb-3">
                          {winner.avatarUrl ? (
                            <Image
                              src={winner.avatarUrl}
                              alt={winner.name}
                              fill
                              className="object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-yellow-500 to-red-500">
                              <span className="text-2xl font-bold text-white">{winner.name.charAt(0)}</span>
                            </div>
                          )}
                        </div>
                        <h3 className="text-lg font-bold text-center">{winner.name}</h3>
                        <p className="text-sm text-white/70 text-center">Boleto #{winner.ticketNumber}</p>
                        <p className="text-sm text-white/70 text-center mt-1">{formatDate(winner.date)}</p>
                      </div>
                      
                      <div className="w-full md:w-2/3 p-6">
                        <div className="mb-4">
                          <div className="flex items-center mb-2">
                            <svg className="text-yellow-300 h-6 w-6 mr-2" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M5 2a1 1 0 011 1v1h1a1 1 0 010 2H6v1a1 1 0 01-2 0V6H3a1 1 0 010-2h1V3a1 1 0 011-1zm0 10a1 1 0 011 1v1h1a1 1 0 110 2H6v1a1 1 0 11-2 0v-1H3a1 1 0 110-2h1v-1a1 1 0 011-1zM12 2a1 1 0 01.967.744L14.146 7.2 17.5 9.134a1 1 0 010 1.732l-3.354 1.935-1.18 4.455a1 1 0 01-1.933 0L9.854 12.8 6.5 10.866a1 1 0 010-1.732l3.354-1.935 1.18-4.455A1 1 0 0112 2z" clipRule="evenodd" />
                            </svg>
                            <h2 className="text-xl font-bold">¡Ganador de {winner.raffleName}!</h2>
                          </div>
                          <p className="text-lg text-yellow-300 font-semibold mb-4">{winner.prize}</p>
                        </div>
                        
                        {winner.testimonial && (
                          <div className="bg-white/5 p-4 rounded-lg mb-4">
                            <p className="italic text-white/90">"{winner.testimonial}"</p>
                          </div>
                        )}
                        
                        <Link 
                          href={`/rifas/${winner.raffleId}`} 
                          className="inline-flex items-center text-yellow-300 hover:text-yellow-400"
                        >
                          Ver detalles de la rifa
                          <svg className="h-4 w-4 ml-1" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                          </svg>
                        </Link>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          <div className="mt-16 text-center">
            <div className="inline-block bg-white/10 backdrop-blur-md p-6 rounded-xl text-white">
              <h3 className="text-xl font-bold mb-2">¿Quieres ser el próximo ganador?</h3>
              <p className="mb-4">Explora nuestras rifas activas y participa ahora</p>
              <Link 
                href="/rifas"
                className="inline-block bg-gradient-to-r from-yellow-500 to-yellow-400 text-black font-bold py-3 px-6 rounded-full hover:shadow-lg transform hover:scale-105 transition-all"
              >
                Ver rifas activas
              </Link>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
