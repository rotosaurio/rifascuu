import { useState, useEffect } from 'react';

export interface Raffle {
  id: string;
  title: string;
  description: string;
  image: string;
  totalTickets: number;
  availableTickets: number;
  ticketPrice: number;
  discountedPrice?: number;
  prizeDescription: string;
  drawDate: Date;
  createdAt: Date;
  companyName?: string;
  companyId?: string;
  isActive: boolean;
}

interface UseRafflesOptions {
  status?: 'active' | 'completed' | 'all';
  limit?: number;
  sort?: string;
  filter?: {
    price?: string;
    search?: string;
    companyId?: string;
  };
  page?: number;
}

export function useRaffles(options: UseRafflesOptions = {}) {
  const [raffles, setRaffles] = useState<Raffle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    const fetchRaffles = async () => {
      setLoading(true);
      setError(null);

      try {
        // Build query string from options
        const queryParams = new URLSearchParams();
        
        if (options.status && options.status !== 'all') {
          queryParams.append('status', options.status);
        }
        
        if (options.limit) {
          queryParams.append('limit', options.limit.toString());
        }
        
        if (options.sort) {
          queryParams.append('sort', options.sort);
        }
        
        if (options.page && options.page > 1) {
          queryParams.append('page', options.page.toString());
        }
        
        if (options.filter) {
          if (options.filter.price) {
            queryParams.append('price', options.filter.price);
          }
          
          if (options.filter.search) {
            queryParams.append('q', options.filter.search);
          }
          
          if (options.filter.companyId) {
            queryParams.append('companyId', options.filter.companyId);
          }
        }
        
        // Make API request
        const queryString = queryParams.toString();
        const endpoint = `/api/raffles${queryString ? `?${queryString}` : ''}`;
        
        const response = await fetch(endpoint);
        const data = await response.json();
        
        if (!response.ok) {
          throw new Error(data.message || 'Error al cargar rifas');
        }

        // For now, use the API data directly or map to expected structure
        // Depending on how your API returns data
        setRaffles(data.raffles);
        
        // Set pagination data if available
        if (data.pagination) {
          setTotalPages(data.pagination.totalPages || 1);
        }
        
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error desconocido');
        console.error('Error fetching raffles:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchRaffles();
  }, [
    options.status,
    options.limit,
    options.sort,
    options.page,
    options.filter?.price,
    options.filter?.search,
    options.filter?.companyId
  ]);

  return {
    raffles,
    loading,
    error,
    totalPages
  };
}
