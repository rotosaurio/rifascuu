import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';

export default function CreateRaffleSuccess() {
  const router = useRouter();
  const { session_id } = router.query;
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');

  useEffect(() => {
    if (session_id) {
      // Verificar el estado del pago cada 2 segundos hasta que se confirme
      const checkPayment = async () => {
        try {
          const res = await fetch(`/api/raffles/verify-payment?session_id=${session_id}`);
          const data = await res.json();

          if (data.success) {
            setStatus('success');
          } else {
            // Si aún no se confirma, intentar de nuevo en 2 segundos
            setTimeout(checkPayment, 2000);
          }
        } catch (error) {
          setStatus('error');
        }
      };

      checkPayment();
    }
  }, [session_id]);

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-yellow-400 via-red-500 to-pink-600">
        <div className="bg-white/10 backdrop-blur-md rounded-xl p-8 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <h2 className="text-xl font-semibold text-white mb-2">
            Procesando tu pago...
          </h2>
          <p className="text-white/80">
            Por favor espera mientras confirmamos tu pago y creamos tu rifa.
          </p>
        </div>
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-yellow-400 via-red-500 to-pink-600">
        <div className="bg-white/10 backdrop-blur-md rounded-xl p-8 text-center max-w-md">
          <div className="text-red-500 text-5xl mb-4">❌</div>
          <h2 className="text-2xl font-bold text-white mb-4">
            Hubo un error al procesar el pago
          </h2>
          <p className="text-white/80 mb-8">
            Por favor contacta al soporte si el problema persiste.
          </p>
          <div className="space-y-4">
            <Link
              href="/raffles/create"
              className="block bg-white/20 hover:bg-white/30 text-white px-6 py-3 rounded-lg transition-colors"
            >
              Intentar nuevamente
            </Link>
            <Link
              href="/dashboard"
              className="block text-white/80 hover:text-white transition-colors"
            >
              Volver al dashboard
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-yellow-400 via-red-500 to-pink-600">
      <div className="bg-white/10 backdrop-blur-md rounded-xl p-8 text-center max-w-md">
        <div className="text-green-400 text-5xl mb-4">✅</div>
        <h2 className="text-2xl font-bold text-white mb-4">
          ¡Tu rifa ha sido creada con éxito!
        </h2>
        <p className="text-white/80 mb-8">
          El pago se ha procesado correctamente y tu rifa está lista para ser publicada.
        </p>
        <div className="space-y-4">
          <Link
            href="/dashboard"
            className="block bg-white/20 hover:bg-white/30 text-white px-6 py-3 rounded-lg transition-colors"
          >
            Ver mis rifas
          </Link>
          <Link
            href="/raffles/create"
            className="block text-white/80 hover:text-white transition-colors"
          >
            Crear otra rifa
          </Link>
        </div>
      </div>
    </div>
  );
} 