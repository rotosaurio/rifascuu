import { useEffect } from 'react';
import Link from 'next/link';

interface ErrorProps {
  statusCode?: number;
  message?: string;
}

export default function Error({ statusCode, message }: ErrorProps) {
  useEffect(() => {
    // Log error to an error reporting service
    console.error(`Error ${statusCode}: ${message || 'An unexpected error occurred'}`);
  }, [statusCode, message]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-yellow-400 via-red-500 to-pink-600 flex items-center justify-center px-4">
      <div className="bg-white/10 backdrop-blur-md rounded-2xl overflow-hidden max-w-lg w-full shadow-2xl p-8">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-white mb-4">
            {statusCode ? `Error ${statusCode}` : 'Ocurrió un error'}
          </h1>
          <div className="mb-8 text-white/80">
            <p>{message || 'Lo sentimos, algo salió mal. Por favor intenta de nuevo más tarde.'}</p>
          </div>
          
          <div className="flex justify-center space-x-4">
            <Link
              href="/"
              className="bg-yellow-500 text-black hover:bg-yellow-400 transition-all px-5 py-3 rounded-full font-bold shadow-lg"
            >
              Regresar al Inicio
            </Link>
            <button
              onClick={() => window.location.reload()}
              className="bg-white/10 text-white hover:bg-white/20 transition-all px-5 py-3 rounded-full font-bold"
            >
              Intentar de Nuevo
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

Error.getInitialProps = ({ res, err }: any) => {
  const statusCode = res ? res.statusCode : err ? err.statusCode : 404;
  const message = err?.message || 'Página no encontrada';
  
  return { statusCode, message };
};
