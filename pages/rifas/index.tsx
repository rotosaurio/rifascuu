import { useState, useEffect } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { Card } from '@/components/ui/Card';
import { FormSelect, FormInput } from '@/components/ui/Form';
import { Button } from '@/components/ui/Button';
import Loading from '@/components/ui/Loading';
import Pagination from '@/components/ui/Pagination';
import RaffleCard from '@/components/raffle/RaffleCard';
import { useRaffles } from '@/hooks/useRaffles';

// Filter options
const priceRanges = [
  { value: '', label: 'Todos los precios' },
  { value: '0-50', label: 'Menos de $50' },
  { value: '50-100', label: '$50 - $100' },
  { value: '100-200', label: '$100 - $200' },
  { value: '200-500', label: '$200 - $500' },
  { value: '500+', label: 'Más de $500' },
];

const sortOptions = [
  { value: 'newest', label: 'Más recientes' },
  { value: 'oldest', label: 'Más antiguos' },
  { value: 'price-low', label: 'Precio: menor a mayor' },
  { value: 'price-high', label: 'Precio: mayor a menor' },
  { value: 'tickets-sold', label: 'Popularidad' },
  { value: 'end-date', label: 'Fecha de cierre' },
];

export default function Raffles() {
  const router = useRouter();
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [priceRange, setPriceRange] = useState('');
  const [sortBy, setSortBy] = useState('newest');

  // Get URL query parameters
  const { q, page, price, sort } = router.query;

  // Set initial filter values from URL on component mount
  useEffect(() => {
    if (q) setSearchTerm(q as string);
    if (price) setPriceRange(price as string);
    if (sort) setSortBy(sort as string);
    if (page) setCurrentPage(parseInt(page as string) || 1);
  }, [q, page, price, sort]);

  // Fetch raffles with current filters
  const { raffles, loading, error } = useRaffles({
    status: 'active',
    // Additional query params would be handled by the API
  });

  // Update URL when filters change
  const updateFilters = () => {
    const query: Record<string, string> = {};
    
    if (searchTerm) query.q = searchTerm;
    if (priceRange) query.price = priceRange;
    if (sortBy !== 'newest') query.sort = sortBy;
    if (currentPage > 1) query.page = currentPage.toString();
    
    router.push({
      pathname: '/rifas',
      query
    }, undefined, { shallow: true });
  };

  // Handle search form submission
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1);
    updateFilters();
  };

  // Handle page change
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    updateFilters();
  };

  // Apply filters for client-side filtering
  // Note: In a real app, this would be done server-side
  const filteredRaffles = raffles; // Simplified for now

  // Calculate pagination
  const itemsPerPage = 12;
  const totalItems = filteredRaffles.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const paginatedRaffles = filteredRaffles.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  return (
    <>
      <Head>
        <title>Rifas Activas | RifasCUU</title>
        <meta name="description" content="Explora todas las rifas activas. Encuentra grandes premios y apoya a empresas locales." />
      </Head>

      <section className="pt-8 pb-16">
        <div className="container mx-auto px-4">
          <h1 className="text-3xl md:text-4xl font-bold mb-2 text-gray-800">Rifas Activas</h1>
          <p className="text-lg text-gray-600 mb-8">
            Explora todas las rifas disponibles y encuentra tu próxima oportunidad de ganar.
          </p>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Filters sidebar */}
            <div className="lg:col-span-1">
              <Card className="sticky top-24">
                <div className="p-6">
                  <h2 className="text-lg font-semibold mb-4">Filtros</h2>
                  
                  {/* Search */}
                  <form onSubmit={handleSearch} className="mb-6">
                    <FormInput
                      type="text"
                      placeholder="Buscar rifas..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="mb-2"
                    />
                    <Button type="submit" fullWidth={true}>
                      Buscar
                    </Button>
                  </form>
                  
                  {/* Price range filter */}
                  <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Precio
                    </label>
                    <FormSelect
                      options={priceRanges}
                      value={priceRange}
                      onChange={(e) => {
                        setPriceRange(e.target.value);
                        setCurrentPage(1);
                        updateFilters();
                      }}
                    />
                  </div>
                  
                  {/* Sort by */}
                  <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Ordenar por
                    </label>
                    <FormSelect
                      options={sortOptions}
                      value={sortBy}
                      onChange={(e) => {
                        setSortBy(e.target.value);
                        setCurrentPage(1);
                        updateFilters();
                      }}
                    />
                  </div>
                  
                  {/* Reset filters */}
                  <Button
                    variant="outline"
                    fullWidth={true}
                    onClick={() => {
                      setSearchTerm('');
                      setPriceRange('');
                      setSortBy('newest');
                      setCurrentPage(1);
                      router.push('/rifas');
                    }}
                  >
                    Limpiar Filtros
                  </Button>
                </div>
              </Card>
            </div>
            
            {/* Raffles grid */}
            <div className="lg:col-span-3">
              {loading ? (
                <div className="flex justify-center py-12">
                  <Loading size="lg" text="Cargando rifas..." />
                </div>
              ) : error ? (
                <div className="bg-red-50 border border-red-200 text-red-800 p-4 rounded-md">
                  {error}
                </div>
              ) : paginatedRaffles.length === 0 ? (
                <div className="text-center py-12 bg-white rounded-lg shadow-sm">
                  <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M12 14h.01M19 21H5a2 2 0 01-2-2V7a2 2 0 012-2h14a2 2 0 012 2v12a2 2 0 01-2 2z" />
                  </svg>
                  <h3 className="mt-2 text-lg font-medium text-gray-900">No se encontraron rifas</h3>
                  <p className="mt-1 text-gray-500">Intenta con otros filtros o vuelve más tarde.</p>
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {paginatedRaffles.map((raffle) => (
                      <div key={raffle.id} className="transition-transform hover:scale-[1.02]">
                        <RaffleCard raffle={raffle} />
                      </div>
                    ))}
                  </div>
                  
                  {/* Pagination */}
                  <div className="mt-10">
                    <Pagination
                      currentPage={currentPage}
                      totalPages={totalPages}
                      onPageChange={handlePageChange}
                    />
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
