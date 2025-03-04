import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { useRouter } from 'next/router';

type Raffle = {
  _id: string;
  name: string;
  description: string;
  totalTickets: number;
  ticketPrice: number;
  soldTickets: Array<{
    number: number;
    buyer: string;
  }>;
  status: 'active' | 'completed' | 'cancelled';
  isPromoted: boolean;
  promotionEndDate?: Date;
  createdAt: Date;
};

export default function Dashboard() {
  const { data: session } = useSession();
  const router = useRouter();
  const [raffles, setRaffles] = useState<Raffle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!session) {
      router.push('/auth/signin');
      return;
    }

    fetchRaffles();
  }, [session, router]);

  const fetchRaffles = async () => {
    try {
      const res = await fetch('/api/raffles/my-raffles');
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || 'Error al obtener las rifas');
      }

      setRaffles(data.raffles);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Error al cargar las rifas');
    } finally {
      setLoading(false);
    }
  };

  if (!session) {
    return null;
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <p className="text-gray-600">Cargando...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Mis Rifas</h1>
          <Link
            href="/raffles/create"
            className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            Crear Nueva Rifa
          </Link>
        </div>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
            {error}
          </div>
        )}

        {raffles.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-6 text-center">
            <p className="text-gray-600">No has creado ninguna rifa aún.</p>
            <Link
              href="/raffles/create"
              className="mt-4 inline-block text-indigo-600 hover:text-indigo-500"
            >
              Crear mi primera rifa
            </Link>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {raffles.map((raffle) => (
              <div
                key={raffle._id}
                className="bg-white rounded-lg shadow overflow-hidden"
              >
                <div className="p-6">
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    {raffle.name}
                  </h3>
                  <p className="text-gray-600 mb-4 line-clamp-2">
                    {raffle.description}
                  </p>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Precio por boleto:</span>
                      <span className="font-medium">${raffle.ticketPrice} MXN</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Boletos vendidos:</span>
                      <span className="font-medium">
                        {raffle.soldTickets.length} / {raffle.totalTickets}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Estado:</span>
                      <span
                        className={`font-medium ${
                          raffle.status === 'active'
                            ? 'text-green-600'
                            : raffle.status === 'completed'
                            ? 'text-blue-600'
                            : 'text-red-600'
                        }`}
                      >
                        {raffle.status === 'active'
                          ? 'Activa'
                          : raffle.status === 'completed'
                          ? 'Completada'
                          : 'Cancelada'}
                      </span>
                    </div>
                    {raffle.isPromoted && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Promoción hasta:</span>
                        <span className="font-medium">
                          {new Date(raffle.promotionEndDate!).toLocaleDateString()}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
                <div className="bg-gray-50 px-6 py-4">
                  <Link
                    href={`/raffles/${raffle._id}`}
                    className="text-indigo-600 hover:text-indigo-500 font-medium"
                  >
                    Ver detalles →
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
} 