import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';

export default function Success() {
  const router = useRouter();
  const { session_id } = router.query;
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');

  useEffect(() => {
    if (session_id) {
      // Verificar el estado del pago
      fetch(`/api/raffles/verify-payment?session_id=${session_id}`)
        .then((res) => res.json())
        .then((data) => {
          if (data.success) {
            setStatus('success');
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
            Verificando el pago...
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
            Hubo un error al procesar el pago
          </h2>
          <p className="mt-2 text-gray-600">
            Por favor contacta al soporte si el problema persiste.
          </p>
          <div className="mt-6">
            <Link
              href="/raffles/create"
              className="text-indigo-600 hover:text-indigo-500"
            >
              Intentar nuevamente
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-green-600">
          ¡Pago completado con éxito!
        </h2>
        <p className="mt-2 text-gray-600">
          Tu rifa ha sido creada y está lista para ser publicada.
        </p>
        <div className="mt-6 space-y-4">
          <Link
            href="/dashboard"
            className="block text-indigo-600 hover:text-indigo-500"
          >
            Ver mis rifas
          </Link>
          <Link
            href="/raffles/create"
            className="block text-indigo-600 hover:text-indigo-500"
          >
            Crear otra rifa
          </Link>
        </div>
      </div>
    </div>
  );
} 