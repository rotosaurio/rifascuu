import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';

export default function TicketPurchaseSuccess() {
  const router = useRouter();
  const { id, session_id } = router.query;
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [purchasedTickets, setPurchasedTickets] = useState<number[]>([]);

  useEffect(() => {
    if (session_id) {
      // Verificar el estado del pago y obtener los boletos comprados
      fetch(`/api/raffles/verify-ticket-purchase?session_id=${session_id}`)
        .then((res) => res.json())
        .then((data) => {
          if (data.success) {
            setStatus('success');
            setPurchasedTickets(data.tickets);
          } else {
            setStatus('error');
          }
        })
        .catch(() => {
          setStatus('error');
        });
    }
  }, [session_id]);

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900">
            Verificando la compra...
          </h2>
          <p className="mt-2 text-gray-600">Por favor espere un momento.</p>
        </div>
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-red-600">
            Hubo un error al procesar la compra
          </h2>
          <p className="mt-2 text-gray-600">
            Por favor contacta al soporte si el problema persiste.
          </p>
          <div className="mt-6">
            <Link
              href={`/raffles/${id}`}
              className="text-indigo-600 hover:text-indigo-500"
            >
              Volver a la rifa
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full mx-auto p-8">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-green-600">
            ¡Compra completada con éxito!
          </h2>
          <p className="mt-2 text-gray-600">
            Has comprado los siguientes boletos:
          </p>
          <div className="mt-4 bg-white rounded-lg shadow-sm p-4">
            <div className="grid grid-cols-5 gap-2">
              {purchasedTickets.map((number) => (
                <div
                  key={number}
                  className="bg-indigo-100 text-indigo-800 font-medium p-2 rounded-md text-center"
                >
                  {number}
                </div>
              ))}
            </div>
          </div>
          <div className="mt-8 space-y-4">
            <Link
              href={`/raffles/${id}`}
              className="block text-indigo-600 hover:text-indigo-500"
            >
              Volver a la rifa
            </Link>
            <Link
              href="/dashboard"
              className="block text-indigo-600 hover:text-indigo-500"
            >
              Ver mis rifas
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
} 