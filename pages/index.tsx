import { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import Image from "next/image";
import { motion, AnimatePresence } from 'framer-motion';

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
  isPromoted: boolean;
  images: string[];
  createdAt: Date;
};

export default function Home() {
  const { data: session } = useSession();
  const [raffles, setRaffles] = useState<Raffle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchRaffles();
  }, []);

  const fetchRaffles = async () => {
    try {
      const res = await fetch('/api/raffles');
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

  // Memoizar las rifas destacadas
  const promotedRaffles = useMemo(() => 
    raffles.filter((raffle) => raffle.isPromoted),
    [raffles]
  );

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-r from-yellow-500 to-red-600">
        <div className="relative">
          <div className="w-16 h-16 border-4 border-white rounded-full animate-spin border-t-transparent"></div>
          <div className="mt-4 text-white text-center font-medium">Cargando...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-yellow-400 via-red-500 to-pink-600">
      {/* Navbar con backdrop-filter optimizado */}
      <nav className="fixed w-full z-50 bg-black/20 supports-[backdrop-filter]:backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex-shrink-0">
              <span className="text-2xl font-bold text-white">RifasChihuahua</span>
            </div>
            <div className="flex space-x-4">
              {session ? (
                <>
                  <Link href="/dashboard" className="text-white hover:text-yellow-300 transition-colors px-3 py-2 rounded-md text-sm font-medium">
                    Dashboard
                  </Link>
                  <Link href="/raffles/create" className="bg-yellow-500 text-black hover:bg-yellow-400 transition-colors px-4 py-2 rounded-full text-sm font-bold">
                    Crear Rifa
                  </Link>
                </>
              ) : (
                <>
                  <Link href="/auth/signin" className="text-white hover:text-yellow-300 transition-colors px-3 py-2 rounded-md text-sm font-medium">
                    Iniciar Sesión
                  </Link>
                  <Link href="/auth/signup" className="bg-yellow-500 text-black hover:bg-yellow-400 transition-colors px-4 py-2 rounded-full text-sm font-bold">
                    Registrarse
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section con animaciones optimizadas */}
      <div className="relative min-h-screen flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 bg-black/40 supports-[backdrop-filter]:backdrop-blur-sm"></div>
        <AnimatePresence>
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
            className="relative z-10 text-center px-4 sm:px-6 lg:px-8"
          >
            <motion.h1 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              className="text-5xl md:text-7xl font-extrabold text-white mb-8"
            >
              Crea y Participa en <span className="text-yellow-400">Rifas</span>
            </motion.h1>
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="text-xl md:text-2xl text-white/90 mb-12 max-w-3xl mx-auto"
            >
              La plataforma líder de rifas en Chihuahua. Organiza tus propias rifas o participa en sorteos emocionantes.
            </motion.p>
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.4 }}
              className="flex flex-col sm:flex-row gap-6 justify-center"
            >
              <Link
                href="/raffles/create"
                className="group relative overflow-hidden bg-yellow-500 text-black font-bold py-4 px-8 rounded-full text-lg shadow-lg hover:shadow-2xl transform hover:scale-105 transition-all"
              >
                <span className="relative z-10">¡Crea tu Rifa Ahora! 🎯</span>
                <div className="absolute inset-0 bg-gradient-to-r from-yellow-400 to-yellow-300 transform scale-x-0 group-hover:scale-x-100 transition-transform origin-left"></div>
              </Link>
              <Link
                href="#rifas-activas"
                className="group relative overflow-hidden bg-white text-black font-bold py-4 px-8 rounded-full text-lg shadow-lg hover:shadow-2xl transform hover:scale-105 transition-all"
              >
                <span className="relative z-10">Ver Rifas Activas 🎲</span>
                <div className="absolute inset-0 bg-gradient-to-r from-gray-100 to-white transform scale-x-0 group-hover:scale-x-100 transition-transform origin-left"></div>
              </Link>
            </motion.div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Features Section con lazy loading */}
      <div className="py-24 bg-gradient-to-b from-black/30 to-transparent supports-[backdrop-filter]:backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="grid md:grid-cols-3 gap-8"
          >
            <div className="group bg-white/10 backdrop-blur-md rounded-2xl p-8 text-center transform hover:scale-105 transition-all hover:bg-white/20">
              <div className="text-6xl mb-6 transform group-hover:scale-110 transition-transform">🔒</div>
              <h3 className="text-2xl font-bold text-white mb-4">100% Seguro</h3>
              <p className="text-white/90 text-lg">Todas las transacciones están protegidas y verificadas con la mejor tecnología</p>
            </div>
            <div className="group bg-white/10 backdrop-blur-md rounded-2xl p-8 text-center transform hover:scale-105 transition-all hover:bg-white/20">
              <div className="text-6xl mb-6 transform group-hover:scale-110 transition-transform">⚡</div>
              <h3 className="text-2xl font-bold text-white mb-4">Fácil y Rápido</h3>
              <p className="text-white/90 text-lg">Crea tu rifa en minutos y empieza a vender boletos al instante</p>
            </div>
            <div className="group bg-white/10 backdrop-blur-md rounded-2xl p-8 text-center transform hover:scale-105 transition-all hover:bg-white/20">
              <div className="text-6xl mb-6 transform group-hover:scale-110 transition-transform">🎁</div>
              <h3 className="text-2xl font-bold text-white mb-4">Grandes Premios</h3>
              <p className="text-white/90 text-lg">Participa en rifas con premios increíbles y gana al instante</p>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Rifas Destacadas con lazy loading e Image optimizada */}
      <div id="rifas-activas" className="py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
          >
            <h2 className="text-4xl font-bold text-white mb-4 text-center">
              Rifas Destacadas ��
            </h2>
            <p className="text-xl text-white/80 text-center mb-12">
              Las mejores oportunidades están aquí
            </p>
          </motion.div>

          {error && (
            <div className="bg-red-400/20 backdrop-blur-md border border-red-500 text-white px-6 py-4 rounded-xl mb-8">
              {error}
            </div>
          )}

          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {promotedRaffles.map((raffle, index) => (
              <motion.div
                key={raffle._id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3, delay: index * 0.1 }}
                layout
              >
                <Link
                  href={`/raffles/${raffle._id}`}
                  className="group block bg-white/10 backdrop-blur-md rounded-2xl overflow-hidden transform hover:scale-105 transition-all hover:bg-white/20"
                >
                  <div className="aspect-w-16 aspect-h-9 bg-gradient-to-br from-yellow-400/20 to-pink-600/20">
                    {raffle.images && raffle.images[0] && (
                      <Image
                        src={raffle.images[0]}
                        alt={raffle.name}
                        fill
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                        className="group-hover:scale-110 transition-transform duration-500"
                        loading="lazy"
                        quality={75}
                      />
                    )}
                  </div>
                  <div className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-2xl font-bold text-white group-hover:text-yellow-300 transition-colors">
                        {raffle.name}
                      </h3>
                      <span className="bg-yellow-500 text-black px-3 py-1 rounded-full text-sm font-bold">
                        ${raffle.ticketPrice} MXN
                      </span>
                    </div>
                    <p className="text-white/80 mb-4 line-clamp-2">
                      {raffle.description}
                    </p>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-white/80">Boletos disponibles:</span>
                        <span className="font-bold text-yellow-300">
                          {raffle.totalTickets - raffle.soldTickets.length}
                        </span>
                      </div>
                      <div className="w-full bg-white/10 rounded-full h-2">
                        <div 
                          className="bg-yellow-500 h-2 rounded-full transition-all"
                          style={{ width: `${(raffle.soldTickets.length / raffle.totalTickets) * 100}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* CTA Section con animaciones optimizadas */}
      <div className="relative py-24 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-black/30 to-black/60 supports-[backdrop-filter]:backdrop-blur-sm"></div>
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center"
        >
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-8">
            ¿Listo para ser parte de algo grande?
          </h2>
          <p className="text-xl text-white/90 mb-12 max-w-2xl mx-auto">
            Únete a nuestra comunidad y descubre las mejores oportunidades
          </p>
          <div className="flex flex-col sm:flex-row gap-6 justify-center">
            {session ? (
              <>
                <Link
                  href="/dashboard"
                  className="group relative overflow-hidden bg-white/10 backdrop-blur-md text-white font-bold py-4 px-8 rounded-full text-lg hover:bg-white/20 transform hover:scale-105 transition-all"
                >
                  Ver Mis Rifas
                </Link>
                <Link
                  href="/raffles/create"
                  className="group relative overflow-hidden bg-yellow-500 text-black font-bold py-4 px-8 rounded-full text-lg transform hover:scale-105 transition-all"
                >
                  <span className="relative z-10">Crear Nueva Rifa</span>
                  <div className="absolute inset-0 bg-gradient-to-r from-yellow-400 to-yellow-300 transform scale-x-0 group-hover:scale-x-100 transition-transform origin-left"></div>
                </Link>
              </>
            ) : (
              <>
                <Link
                  href="/auth/signin"
                  className="group relative overflow-hidden bg-white/10 backdrop-blur-md text-white font-bold py-4 px-8 rounded-full text-lg hover:bg-white/20 transform hover:scale-105 transition-all"
                >
                  Iniciar Sesión
                </Link>
                <Link
                  href="/auth/signup"
                  className="group relative overflow-hidden bg-yellow-500 text-black font-bold py-4 px-8 rounded-full text-lg transform hover:scale-105 transition-all"
                >
                  <span className="relative z-10">Registrarse</span>
                  <div className="absolute inset-0 bg-gradient-to-r from-yellow-400 to-yellow-300 transform scale-x-0 group-hover:scale-x-100 transition-transform origin-left"></div>
                </Link>
              </>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
