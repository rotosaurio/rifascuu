import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import Link from 'next/link';

type Raffle = {
  _id: string;
  title: string;
  description: string;
  ticketPrice: number;
  totalTickets: number;
  soldTickets: Array<{
    number: number;
    buyer: string;
  }>;
  status: 'active' | 'completed' | 'deleted';
  createdAt: Date;
};

export default function MyRaffles() {
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
        throw new Error(data.message);
      }

      setRaffles(data.raffles);
    } catch (error) {
      setError('Error al cargar las rifas');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (raffleId: string, status: string) => {
    try {
      const res = await fetch(`/api/raffles/${raffleId}/update-status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message);
      }

      // Actualizar la lista de rifas
      fetchRaffles();
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Error al actualizar el estado');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="bg-white shadow rounded-lg p-6">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold text-gray-900">Mis Rifas</h1>
            <Link
              href="/raffles/create"
              className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700"
            >
              Crear Nueva Rifa
            </Link>
          </div>

          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
              {error}
            </div>
          )}

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead>
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Título
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Precio por Boleto
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Boletos Vendidos
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Estado
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {raffles.map((raffle) => (
                  <tr key={raffle._id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Link
                        href={`/raffles/${raffle._id}`}
                        className="text-indigo-600 hover:text-indigo-900"
                      >
                        {raffle.title}
                      </Link>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      ${raffle.ticketPrice.toFixed(2)} MXN
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {raffle.soldTickets.length} / {raffle.totalTickets}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          raffle.status === 'active'
                            ? 'bg-green-100 text-green-800'
                            : raffle.status === 'completed'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {raffle.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {raffle.status === 'active' && (
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleUpdateStatus(raffle._id, 'deleted')}
                            className="text-red-600 hover:text-red-900"
                          >
                            Eliminar
                          </button>
                          <button
                            onClick={() => handleUpdateStatus(raffle._id, 'completed')}
                            className="text-blue-600 hover:text-blue-900"
                          >
                            Completar
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
} 