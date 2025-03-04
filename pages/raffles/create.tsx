import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/router';

export default function CreateRaffle() {
  const { data: session } = useSession();
  const router = useRouter();
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    totalTickets: 100,
    ticketPrice: 0,
    images: [] as string[],
    contactInfo: '',
    isPromoted: false,
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const calculatePrice = (tickets: number) => {
    let price = 0;
    
    if (tickets <= 100) {
      return 0;
    }

    if (tickets <= 10000) {
      price = Math.ceil(tickets / 10) * 1;
    } else if (tickets <= 50000) {
      price = Math.ceil(tickets / 10) * 0.6;
    } else if (tickets <= 1000000) {
      price = Math.ceil(tickets / 10) * 0.35;
    } else {
      price = tickets * 0.01;
    }

    return price;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/raffles/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || 'Error al crear la rifa');
      }

      if (data.url) {
        // Redirigir a Stripe para el pago
        window.location.href = data.url;
      } else {
        // Rifa creada exitosamente (gratis)
        router.push('/dashboard');
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Error al crear la rifa');
    } finally {
      setLoading(false);
    }
  };

  const serviceFee = calculatePrice(formData.totalTickets);
  const promotionFee = formData.isPromoted ? 500 : 0;
  const totalFee = serviceFee + promotionFee;

  if (!session) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <p className="text-red-600">Debes iniciar sesión para crear una rifa</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <div className="bg-white p-8 rounded-lg shadow">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">Crear Nueva Rifa</h1>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
                {error}
              </div>
            )}

            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                Nombre de la Rifa
              </label>
              <input
                type="text"
                id="name"
                required
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>

            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                Descripción
              </label>
              <textarea
                id="description"
                required
                rows={4}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </div>

            <div>
              <label htmlFor="totalTickets" className="block text-sm font-medium text-gray-700">
                Cantidad de Boletos
              </label>
              <input
                type="number"
                id="totalTickets"
                required
                min="1"
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                value={formData.totalTickets}
                onChange={(e) => setFormData({ ...formData, totalTickets: parseInt(e.target.value) })}
              />
              <p className="mt-1 text-sm text-gray-500">
                Costo del servicio: ${serviceFee.toFixed(2)} MXN
              </p>
            </div>

            <div>
              <label htmlFor="ticketPrice" className="block text-sm font-medium text-gray-700">
                Precio por Boleto (MXN)
              </label>
              <input
                type="number"
                id="ticketPrice"
                required
                min="0"
                step="0.01"
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                value={formData.ticketPrice}
                onChange={(e) => setFormData({ ...formData, ticketPrice: parseFloat(e.target.value) })}
              />
            </div>

            <div>
              <label htmlFor="contactInfo" className="block text-sm font-medium text-gray-700">
                Información de Contacto
              </label>
              <textarea
                id="contactInfo"
                required
                rows={2}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                value={formData.contactInfo}
                onChange={(e) => setFormData({ ...formData, contactInfo: e.target.value })}
              />
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                id="isPromoted"
                className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                checked={formData.isPromoted}
                onChange={(e) => setFormData({ ...formData, isPromoted: e.target.checked })}
              />
              <label htmlFor="isPromoted" className="ml-2 block text-sm text-gray-900">
                Promocionar en la página principal ($500 MXN/mes)
              </label>
            </div>

            <div className="bg-gray-50 p-4 rounded-md">
              <h3 className="text-lg font-medium text-gray-900">Resumen de Costos</h3>
              <dl className="mt-4 space-y-2">
                <div className="flex justify-between">
                  <dt className="text-sm text-gray-600">Costo del servicio:</dt>
                  <dd className="text-sm font-medium text-gray-900">${serviceFee.toFixed(2)} MXN</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-sm text-gray-600">Costo de promoción:</dt>
                  <dd className="text-sm font-medium text-gray-900">${promotionFee.toFixed(2)} MXN</dd>
                </div>
                <div className="flex justify-between border-t border-gray-200 pt-2">
                  <dt className="text-sm font-medium text-gray-900">Total:</dt>
                  <dd className="text-sm font-medium text-gray-900">${totalFee.toFixed(2)} MXN</dd>
                </div>
              </dl>
            </div>

            <div>
              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
              >
                {loading ? 'Procesando...' : 'Crear Rifa'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
} 