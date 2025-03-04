import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { useSession } from 'next-auth/react';
import Link from 'next/link';

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
  images: string[];
  contactInfo: string;
  creator: {
    _id: string;
    name: string;
  };
  createdAt: Date;
  winner?: string;
};

export default function RaffleDetail() {
  const router = useRouter();
  const { data: session } = useSession();
  const { id } = router.query;
  const [raffle, setRaffle] = useState<Raffle | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedTickets, setSelectedTickets] = useState<number[]>([]);
  const [buyingTickets, setBuyingTickets] = useState(false);
  const [selectingWinner, setSelectingWinner] = useState(false);

  useEffect(() => {
    if (id) {
      fetchRaffle();
    }
  }, [id]);

  const fetchRaffle = async () => {
    try {
      const res = await fetch(`/api/raffles/${id}`);
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || 'Error al obtener la rifa');
      }

      setRaffle(data.raffle);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Error al cargar la rifa');
    } finally {
      setLoading(false);
    }
  };

  const handleTicketSelection = (ticketNumber: number) => {
    if (selectedTickets.includes(ticketNumber)) {
      setSelectedTickets(selectedTickets.filter((t) => t !== ticketNumber));
    } else {
      setSelectedTickets([...selectedTickets, ticketNumber]);
    }
  };

  const handleBuyTickets = async () => {
    if (!session) {
      router.push('/auth/signin');
      return;
    }

    if (selectedTickets.length === 0) {
      setError('Selecciona al menos un boleto');
      return;
    }

    setBuyingTickets(true);
    setError('');

    try {
      const res = await fetch('/api/raffles/buy-tickets', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          raffleId: id,
          tickets: selectedTickets,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || 'Error al comprar boletos');
      }

      if (data.url) {
        // Redirigir a Stripe para el pago
        window.location.href = data.url;
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Error al comprar boletos');
    } finally {
      setBuyingTickets(false);
    }
  };

  const handleSelectWinner = async () => {
    if (!confirm('¿Estás seguro de que deseas seleccionar un ganador? Esta acción no se puede deshacer.')) {
      return;
    }

    setSelectingWinner(true);
    setError('');

    try {
      const res = await fetch('/api/raffles/select-winner', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          raffleId: id,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || 'Error al seleccionar ganador');
      }

      // Recargar la rifa para mostrar el ganador
      await fetchRaffle();
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Error al seleccionar ganador');
    } finally {
      setSelectingWinner(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <p className="text-gray-600">Cargando...</p>
      </div>
    );
  }

  if (!raffle) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-red-600">
            Rifa no encontrada
          </h2>
          <Link href="/" className="mt-4 text-indigo-600 hover:text-indigo-500">
            Volver al inicio
          </Link>
        </div>
      </div>
    );
  }

  const availableTickets = Array.from(
    { length: raffle.totalTickets },
    (_, i) => i + 1
  ).filter((number) => !raffle.soldTickets.some((t) => t.number === number));

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          <div className="p-8">
            <div className="flex justify-between items-start">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">
                  {raffle.name}
                </h1>
                <p className="text-gray-600 mb-4">{raffle.description}</p>
              </div>
              <div className="text-right">
                <p className="text-xl font-bold text-gray-900">
                  ${raffle.ticketPrice} MXN
                </p>
                <p className="text-sm text-gray-600">por boleto</p>
              </div>
            </div>

            <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-8">
              <div>
                <h2 className="text-xl font-semibold text-gray-900 mb-4">
                  Información de la Rifa
                </h2>
                <dl className="space-y-4">
                  <div>
                    <dt className="text-sm font-medium text-gray-600">
                      Organizador
                    </dt>
                    <dd className="mt-1 text-sm text-gray-900">
                      {raffle.creator.name}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-600">
                      Información de Contacto
                    </dt>
                    <dd className="mt-1 text-sm text-gray-900">
                      {raffle.contactInfo}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-600">
                      Boletos Disponibles
                    </dt>
                    <dd className="mt-1 text-sm text-gray-900">
                      {availableTickets.length} de {raffle.totalTickets}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-600">Estado</dt>
                    <dd className="mt-1">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          raffle.status === 'active'
                            ? 'bg-green-100 text-green-800'
                            : raffle.status === 'completed'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {raffle.status === 'active'
                          ? 'Activa'
                          : raffle.status === 'completed'
                          ? 'Completada'
                          : 'Cancelada'}
                      </span>
                    </dd>
                  </div>
                </dl>
              </div>

              <div>
                <h2 className="text-xl font-semibold text-gray-900 mb-4">
                  Seleccionar Boletos
                </h2>
                {error && (
                  <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
                    {error}
                  </div>
                )}
                <div className="grid grid-cols-5 gap-2">
                  {Array.from({ length: raffle.totalTickets }, (_, i) => i + 1).map(
                    (number) => {
                      const isSold = raffle.soldTickets.some(
                        (t) => t.number === number
                      );
                      const isSelected = selectedTickets.includes(number);

                      return (
                        <button
                          key={number}
                          onClick={() => handleTicketSelection(number)}
                          disabled={isSold || raffle.status !== 'active'}
                          className={`p-2 text-sm font-medium rounded-md ${
                            isSold
                              ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                              : isSelected
                              ? 'bg-indigo-600 text-white'
                              : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
                          }`}
                        >
                          {number}
                        </button>
                      );
                    }
                  )}
                </div>

                {selectedTickets.length > 0 && (
                  <div className="mt-6">
                    <div className="bg-gray-50 p-4 rounded-md">
                      <h3 className="text-lg font-medium text-gray-900">
                        Resumen de Compra
                      </h3>
                      <dl className="mt-4 space-y-2">
                        <div className="flex justify-between">
                          <dt className="text-sm text-gray-600">
                            Boletos seleccionados:
                          </dt>
                          <dd className="text-sm font-medium text-gray-900">
                            {selectedTickets.length}
                          </dd>
                        </div>
                        <div className="flex justify-between border-t border-gray-200 pt-2">
                          <dt className="text-sm font-medium text-gray-900">
                            Total:
                          </dt>
                          <dd className="text-sm font-medium text-gray-900">
                            ${(selectedTickets.length * raffle.ticketPrice).toFixed(2)}{' '}
                            MXN
                          </dd>
                        </div>
                      </dl>
                    </div>

                    <button
                      onClick={handleBuyTickets}
                      disabled={buyingTickets}
                      className="mt-4 w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
                    >
                      {buyingTickets ? 'Procesando...' : 'Comprar Boletos'}
                    </button>
                  </div>
                )}
              </div>
            </div>

            {session?.user?.id === raffle.creator._id && raffle.status === 'active' && (
              <div className="mt-6">
                <button
                  onClick={handleSelectWinner}
                  disabled={selectingWinner || raffle.soldTickets.length === 0}
                  className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50"
                >
                  {selectingWinner ? 'Seleccionando...' : 'Seleccionar Ganador'}
                </button>
                {raffle.soldTickets.length === 0 && (
                  <p className="mt-2 text-sm text-red-600">
                    No hay boletos vendidos para seleccionar un ganador
                  </p>
                )}
              </div>
            )}

            {raffle.status === 'completed' && raffle.winner && (
              <div className="mt-6 bg-green-50 border border-green-200 rounded-md p-4">
                <h3 className="text-lg font-medium text-green-800">¡Ganador!</h3>
                <p className="mt-2 text-sm text-green-700">
                  El boleto ganador fue el número{' '}
                  {raffle.soldTickets.find(t => t.buyer === raffle.winner)?.number}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 