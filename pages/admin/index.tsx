import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import Image from 'next/image';

// Define types for the raffles and promo codes
interface RaffleData {
  _id: string;
  title: string;
  status: 'active' | 'completed' | 'deleted';
  isPromoted: boolean;
  creator: {
    name: string;
    email: string;
  } | null;
  soldTickets: Array<any>;
  totalTickets: number;
  createdAt: string;
}

interface PromoUser {
  _id: string;
  name: string;
  email: string;
  promoCode: string;
  promoCodeUsed: boolean;
}

// Admin dashboard main component
export default function AdminDashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('raffles');
  const [raffles, setRaffles] = useState<RaffleData[]>([]);
  const [promoCodes, setPromoCodes] = useState<PromoUser[]>([]);
  const [newPromo, setNewPromo] = useState({ email: '', freeRaffles: 1 });
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Check if user is logged in and admin
  useEffect(() => {
    if (status === 'loading') return;
    
    if (!session) {
      router.push('/');
      return;
    }

    const checkAdminStatus = async () => {
      try {
        const response = await fetch('/api/admin/raffles');
        
        if (response.ok) {
          setIsAdmin(true);
          if (activeTab === 'raffles') {
            const data = await response.json();
            setRaffles(data);
          }
        } else {
          // Not an admin, redirect
          router.push('/');
        }
      } catch (error) {
        console.error('Error checking admin status:', error);
        router.push('/');
      } finally {
        setLoading(false);
      }
    };

    checkAdminStatus();
  }, [session, status, router, activeTab]);

  // Fetch promo codes when the promo tab is active
  useEffect(() => {
    if (activeTab === 'promos' && isAdmin) {
      fetchPromoCodes();
    }
  }, [activeTab, isAdmin]);

  // Fetch raffles when the raffles tab is active
  useEffect(() => {
    if (activeTab === 'raffles' && isAdmin) {
      fetchRaffles();
    }
  }, [activeTab, isAdmin]);

  const fetchRaffles = async () => {
    try {
      const response = await fetch('/api/admin/raffles');
      if (response.ok) {
        const data = await response.json();
        setRaffles(data);
      }
    } catch (error) {
      console.error('Error fetching raffles:', error);
    }
  };

  const fetchPromoCodes = async () => {
    try {
      const response = await fetch('/api/admin/generate-promo');
      if (response.ok) {
        const data = await response.json();
        setPromoCodes(data);
      }
    } catch (error) {
      console.error('Error fetching promo codes:', error);
    }
  };

  const handleGeneratePromo = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    try {
      const response = await fetch('/api/admin/generate-promo', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: newPromo.email,
          freeRaffles: parseInt(String(newPromo.freeRaffles)),
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setSuccessMessage(`Promo code ${data.user.promoCode} generated successfully for ${data.user.email}`);
        setNewPromo({ email: '', freeRaffles: 1 });
        fetchPromoCodes();
      } else {
        setErrorMessage(data.message || 'Error generating promo code');
      }
    } catch (error) {
      console.error('Error generating promo code:', error);
      setErrorMessage('Error generating promo code');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!isAdmin) {
    return null; // Component will redirect in useEffect
  }

  return (
    <>
      <Head>
        <title>Admin Dashboard | RifasCU</title>
        <meta name="description" content="Panel de administración para RifasCU" />
      </Head>

      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8">Panel de Administración</h1>

        {/* Tab Navigation */}
        <div className="mb-6 border-b border-gray-200">
          <ul className="flex flex-wrap -mb-px">
            <li className="mr-2">
              <button
                onClick={() => setActiveTab('raffles')}
                className={`inline-block p-4 ${
                  activeTab === 'raffles'
                    ? 'text-blue-600 border-b-2 border-blue-600'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                Rifas
              </button>
            </li>
            <li className="mr-2">
              <button
                onClick={() => setActiveTab('promos')}
                className={`inline-block p-4 ${
                  activeTab === 'promos'
                    ? 'text-blue-600 border-b-2 border-blue-600'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                Códigos Promocionales
              </button>
            </li>
          </ul>
        </div>

        {/* Raffles Tab Content */}
        {activeTab === 'raffles' && (
          <div>
            <h2 className="text-2xl font-semibold mb-4">Todas las Rifas</h2>
            
            <div className="overflow-x-auto">
              <table className="min-w-full bg-white border border-gray-200">
                <thead>
                  <tr>
                    <th className="border px-4 py-2">Título</th>
                    <th className="border px-4 py-2">Estado</th>
                    <th className="border px-4 py-2">Creador</th>
                    <th className="border px-4 py-2">Boletos Vendidos</th>
                    <th className="border px-4 py-2">Total Boletos</th>
                    <th className="border px-4 py-2">Fecha Creación</th>
                    <th className="border px-4 py-2">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {raffles.map((raffle) => (
                    <tr key={raffle._id}>
                      <td className="border px-4 py-2">{raffle.title}</td>
                      <td className="border px-4 py-2">
                        <span className={`px-2 py-1 rounded-full text-xs 
                          ${raffle.status === 'active' ? 'bg-green-200 text-green-800' :
                          raffle.status === 'completed' ? 'bg-blue-200 text-blue-800' :
                          'bg-red-200 text-red-800'}`}>
                          {raffle.status === 'active' ? 'Activa' : 
                           raffle.status === 'completed' ? 'Completada' : 'Eliminada'}
                        </span>
                        {raffle.isPromoted && (
                          <span className="ml-2 px-2 py-1 rounded-full text-xs bg-purple-200 text-purple-800">
                            Promovida
                          </span>
                        )}
                      </td>
                      <td className="border px-4 py-2">{raffle.creator?.name || 'Usuario eliminado'}</td>
                      <td className="border px-4 py-2">{raffle.soldTickets?.length || 0}</td>
                      <td className="border px-4 py-2">{raffle.totalTickets}</td>
                      <td className="border px-4 py-2">
                        {new Date(raffle.createdAt).toLocaleDateString()}
                      </td>
                      <td className="border px-4 py-2">
                        <Link href={`/raffles/${raffle._id}`} className="text-blue-600 hover:underline">
                          Ver
                        </Link>
                      </td>
                    </tr>
                  ))}
                  {raffles.length === 0 && (
                    <tr>
                      <td colSpan={7} className="border px-4 py-4 text-center">
                        No hay rifas disponibles
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Promo Codes Tab Content */}
        {activeTab === 'promos' && (
          <div>
            <h2 className="text-2xl font-semibold mb-4">Códigos Promocionales</h2>

            {/* Form to generate new promo code */}
            <div className="bg-white rounded-lg shadow p-6 mb-8">
              <h3 className="text-xl font-medium mb-4">Generar Nuevo Código</h3>
              
              {errorMessage && (
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
                  {errorMessage}
                </div>
              )}
              
              {successMessage && (
                <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
                  {successMessage}
                </div>
              )}
              
              <form onSubmit={handleGeneratePromo} className="space-y-4">
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                    Correo del Usuario
                  </label>
                  <input
                    type="email"
                    id="email"
                    value={newPromo.email}
                    onChange={(e) => setNewPromo({ ...newPromo, email: e.target.value })}
                    required
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                
                <div>
                  <label htmlFor="freeRaffles" className="block text-sm font-medium text-gray-700">
                    Número de Rifas Gratuitas
                  </label>
                  <input
                    type="number"
                    id="freeRaffles"
                    value={newPromo.freeRaffles}
                    onChange={(e) => setNewPromo({ ...newPromo, freeRaffles: parseInt(e.target.value) || 1 })}
                    min="1"
                    required
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                
                <button
                  type="submit"
                  className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Generar Código
                </button>
              </form>
            </div>

            {/* List of existing promo codes */}
            <div className="overflow-x-auto">
              <table className="min-w-full bg-white border border-gray-200">
                <thead>
                  <tr>
                    <th className="border px-4 py-2">Usuario</th>
                    <th className="border px-4 py-2">Correo</th>
                    <th className="border px-4 py-2">Código Promocional</th>
                    <th className="border px-4 py-2">Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {promoCodes.map((user) => (
                    <tr key={user._id}>
                      <td className="border px-4 py-2">{user.name}</td>
                      <td className="border px-4 py-2">{user.email}</td>
                      <td className="border px-4 py-2 font-mono">{user.promoCode}</td>
                      <td className="border px-4 py-2">
                        <span className={`px-2 py-1 rounded-full text-xs ${
                          user.promoCodeUsed ? 'bg-gray-200 text-gray-800' : 'bg-green-200 text-green-800'
                        }`}>
                          {user.promoCodeUsed ? 'Usado' : 'Disponible'}
                        </span>
                      </td>
                    </tr>
                  ))}
                  {promoCodes.length === 0 && (
                    <tr>
                      <td colSpan={4} className="border px-4 py-4 text-center">
                        No hay códigos promocionales disponibles
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </>
  );
}