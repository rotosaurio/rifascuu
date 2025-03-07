import { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import Image from 'next/image';
import { Card, CardContent } from '@/components/ui/Card';
import Loading from '@/components/ui/Loading';

interface Company {
  id: string;
  name: string;
  logo?: string;
  description: string;
  rafflesCount: number;
  verified: boolean;
}

export default function Empresas() {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // In a real app, this would fetch from an API endpoint
    // For now, using placeholder data
    const fetchCompanies = async () => {
      try {
        setLoading(true);
        
        // Simulated API call - replace with actual API call
        setTimeout(() => {
          setCompanies([
            {
              id: '1',
              name: 'Sorteos Chihuahua',
              logo: 'https://images.unsplash.com/photo-1560179707-f14e90ef3623',
              description: 'Empresa líder en sorteos y rifas en Chihuahua.',
              rafflesCount: 24,
              verified: true,
            },
            {
              id: '2',
              name: 'Rifas del Norte',
              logo: 'https://images.unsplash.com/photo-1516387938699-a93567ec168e',
              description: 'Especialistas en rifas de vehículos y tecnología.',
              rafflesCount: 18,
              verified: true,
            },
            {
              id: '3',
              name: 'MegaPremios',
              logo: 'https://images.unsplash.com/photo-1524055988636-436cfa46e59e',
              description: 'Los mejores premios garantizados.',
              rafflesCount: 12,
              verified: false,
            },
          ]);
          setLoading(false);
        }, 1000);
        
      } catch (err) {
        setError('Error al cargar las empresas');
        setLoading(false);
      }
    };

    fetchCompanies();
  }, []);

  return (
    <>
      <Head>
        <title>Empresas | RifasCUU</title>
        <meta name="description" content="Descubre las empresas organizadoras de rifas en nuestra plataforma." />
      </Head>

      <div className="min-h-screen py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-white mb-4">Empresas Organizadoras</h1>
            <p className="text-xl text-white/90 max-w-2xl mx-auto">
              Conoce las empresas verificadas que organizan rifas en nuestra plataforma
            </p>
          </div>

          {loading ? (
            <div className="flex justify-center py-12">
              <Loading color="white" size="lg" text="Cargando empresas..." />
            </div>
          ) : error ? (
            <div className="bg-red-400/20 backdrop-blur-md border border-red-500 text-white px-6 py-4 rounded-xl">
              <p>{error}</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {companies.map((company) => (
                <Link href={`/empresas/${company.id}`} key={company.id}>
                  <Card className="hover:shadow-xl transition-shadow h-full bg-white/10 backdrop-blur-md text-white border-none hover:bg-white/20">
                    <CardContent className="p-6">
                      <div className="flex items-center mb-4">
                        <div className="relative h-16 w-16 mr-4 bg-white/10 rounded-full overflow-hidden">
                          {company.logo ? (
                            <Image
                              src={company.logo}
                              alt={company.name}
                              fill
                              className="object-cover"
                            />
                          ) : (
                            <div className="h-full w-full flex items-center justify-center bg-gradient-to-br from-yellow-400 to-red-500">
                              <span className="text-2xl font-bold text-white">{company.name.charAt(0)}</span>
                            </div>
                          )}
                        </div>
                        <div>
                          <h2 className="text-xl font-bold">{company.name}</h2>
                          <div className="flex items-center mt-1">
                            {company.verified && (
                              <div className="flex items-center text-sm text-yellow-300">
                                <svg className="h-4 w-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                </svg>
                                Verificada
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      <p className="text-white/80 mb-6">{company.description}</p>
                      
                      <div className="flex justify-between items-center">
                        <span className="text-white/70">Rifas organizadas:</span>
                        <span className="font-bold text-yellow-300">{company.rafflesCount}</span>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          )}
          
          <div className="mt-16 text-center">
            <div className="inline-block bg-white/10 backdrop-blur-md p-6 rounded-xl text-white">
              <h3 className="text-xl font-bold mb-2">¿Quieres organizar rifas en nuestra plataforma?</h3>
              <p className="mb-4">Regístrate como empresa y comienza a crear rifas con nosotros</p>
              <Link 
                href="/registro-empresa"
                className="inline-block bg-gradient-to-r from-yellow-500 to-yellow-400 text-black font-bold py-3 px-6 rounded-full hover:shadow-lg transform hover:scale-105 transition-all"
              >
                Registrar empresa
              </Link>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
