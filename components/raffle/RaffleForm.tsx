import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Image from 'next/image';

const raffleFormSchema = z.object({
  title: z.string().min(5, 'El título debe tener al menos 5 caracteres'),
  description: z.string().min(20, 'La descripción debe tener al menos 20 caracteres'),
  prizeDescription: z.string().min(10, 'La descripción del premio debe tener al menos 10 caracteres'),
  totalTickets: z.number().int().positive('El número de boletos debe ser positivo'),
  ticketPrice: z.number().positive('El precio debe ser positivo'),
  applyDiscount: z.boolean().default(false),
  discountPercentage: z.number().min(0).max(100).optional(),
  drawDate: z.string(),
  image: z.any(),
  prizeImages: z.any(),
  isPromoted: z.boolean().default(false),
  promotionMonths: z.number().min(1).max(12).optional(),
});

type RaffleFormValues = z.infer<typeof raffleFormSchema>;

interface RaffleFormProps {
  isEditMode?: boolean;
  initialData?: any;
  isCompanyOwner?: boolean;
}

export default function RaffleForm({ isEditMode = false, initialData = {}, isCompanyOwner = false }: RaffleFormProps) {
  const router = useRouter();
  const [mainImagePreview, setMainImagePreview] = useState<string | null>(initialData.image || null);
  const [prizeImagePreviews, setPrizeImagePreviews] = useState<string[]>(initialData.prizeImages || []);
  const [userActiveRaffles, setUserActiveRaffles] = useState<number | null>(null);
  
  // Get tomorrow's date for min date in draw date picker
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowFormatted = tomorrow.toISOString().split('T')[0];
  
  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm<RaffleFormValues>({
    resolver: zodResolver(raffleFormSchema),
    defaultValues: {
      ...initialData,
      applyDiscount: Boolean(initialData.discountPercentage),
      drawDate: initialData.drawDate ? new Date(initialData.drawDate).toISOString().split('T')[0] : tomorrowFormatted,
    }
  });
  
  const applyDiscount = watch('applyDiscount');
  const ticketPrice = watch('ticketPrice');
  const discountPercentage = watch('discountPercentage');
  const isPromoted = watch('isPromoted');
  const promotionMonths = watch('promotionMonths') || 1;
  
  const handleMainImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      
      reader.onload = (e) => {
        if (e.target?.result) {
          setMainImagePreview(e.target.result as string);
        }
      };
      
      reader.readAsDataURL(file);
    }
  };
  
  const handlePrizeImagesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const filesLength = e.target.files.length;
      const newPreviews: string[] = [];
      
      Array.from(e.target.files).forEach(file => {
        const reader = new FileReader();
        
        reader.onload = (event) => {
          if (event.target?.result) {
            newPreviews.push(event.target.result as string);
            if (newPreviews.length === filesLength) {
              setPrizeImagePreviews(prev => [...prev, ...newPreviews]);
            }
          }
        };
        
        reader.readAsDataURL(file);
      });
    }
  };
  
  const onSubmit = async (data: RaffleFormValues) => {
    try {
      const formData = new FormData();
      
      Object.entries(data).forEach(([key, value]) => {
        if (key !== 'image' && key !== 'prizeImages') {
          formData.append(key, String(value));
        }
      });
      
      if (data.image && data.image[0]) {
        formData.append('image', data.image[0] as Blob);
      }
      
      if (data.prizeImages && data.prizeImages.length) {
        Array.from(data.prizeImages).forEach((file) => {
          formData.append('prizeImages', file as Blob);
        });
      }
      
      const endpoint = isEditMode 
        ? `/api/raffles/${initialData.id}` 
        : '/api/raffles';
      
      const method = isEditMode ? 'PUT' : 'POST';
      
      const response = await fetch(endpoint, {
        method,
        body: formData,
      });
      
      if (response.ok) {
        const result = await response.json();
        router.push(isCompanyOwner ? '/empresa/rifas' : '/admin/raffles');
      } else {
        throw new Error('Failed to save raffle');
      }
    } catch (error) {
      console.error('Error saving raffle:', error);
      // Show error message to user
    }
  };
  
  const discountedPrice = applyDiscount && discountPercentage && ticketPrice 
    ? ticketPrice * (1 - (discountPercentage / 100)) 
    : null;
    
  // Add a function to check the user's active raffles
  useEffect(() => {
    const checkActiveRaffles = async () => {
      try {
        const res = await fetch('/api/raffles/user-active-count');
        if (res.ok) {
          const data = await res.json();
          setUserActiveRaffles(data.count);
        }
      } catch (error) {
        console.error('Failed to fetch active raffles count:', error);
      }
    };
    
    checkActiveRaffles();
  }, []);
  
  // Calculate the final price
  const calculateTotalPrice = () => {
    const totalTicketsCount = watch('totalTickets') || 0;
    const promotionMonthsCount = watch('promotionMonths') || 1;
    
    // Check if user is eligible for a free raffle
    const isFreeRaffle = userActiveRaffles === 0 && totalTicketsCount <= 100;
    
    // If it's a free raffle, return all zeros
    if (isFreeRaffle) {
      return {
        fixedFee: 0,
        ticketBasedCommission: 0,
        promotionPrice: 0,
        totalPrice: 0,
        isFreeRaffle: true
      };
    }
    
    // Fixed fee for creating a raffle
    const fixedFee = 20; // 20 MXN
    
    // Calculate ticket-based commission rate
    let ticketCommissionRate = 0;
    let commissionPerTenTickets = 0;
    
    if (totalTicketsCount <= 100) {
      commissionPerTenTickets = 1.00; // $1 per 10 tickets for small raffles
    } else if (totalTicketsCount <= 1000) {
      commissionPerTenTickets = 0.80; // $0.80 per 10 tickets for medium raffles
    } else if (totalTicketsCount <= 10000) {
      commissionPerTenTickets = 0.70; // $0.70 per 10 tickets for larger raffles
    } else if (totalTicketsCount <= 50000) {
      commissionPerTenTickets = 0.50; // $0.50 per 10 tickets for very large raffles
    } else if (totalTicketsCount <= 1000000) {
      commissionPerTenTickets = 0.30; // $0.30 per 10 tickets for massive raffles
    } else {
      // For extremely large raffles, charge per individual ticket
      ticketCommissionRate = 0.01; // $0.01 per ticket
    }
    
    // Calculate total ticket-based commission
    const ticketsInTens = Math.ceil(totalTicketsCount / 10);
    const ticketBasedCommission = ticketCommissionRate > 0 
      ? totalTicketsCount * ticketCommissionRate 
      : ticketsInTens * commissionPerTenTickets;
    
    // Promotion price (if applicable)
    const promotionPrice = isPromoted ? 500 * promotionMonthsCount : 0; // 500 MXN per month for promotion
    
    // Calculate total price
    const totalPrice = fixedFee + ticketBasedCommission + promotionPrice;
    
    return {
      fixedFee,
      ticketBasedCommission,
      promotionPrice,
      totalPrice,
      isFreeRaffle: false
    };
  };
  
  const priceBreakdown = calculateTotalPrice();
  
  // Promotion selection section
  const renderPromotionSection = () => (
    <div className="mt-6">
      <div className="flex items-center mb-4">
        <input
          type="checkbox"
          id="isPromoted"
          {...register('isPromoted')}
          className="h-4 w-4 text-blue-600 border-gray-300 rounded"
        />
        <label htmlFor="isPromoted" className="ml-2 block text-sm font-medium text-gray-700">
          Promocionar en la página principal (500 MXN por mes)
        </label>
      </div>
      
      {isPromoted && (
        <div className="ml-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Duración de la promoción (meses)
          </label>
          <select
            {...register('promotionMonths', { valueAsNumber: true })}
            className="w-full p-2 border border-gray-300 rounded-md"
            defaultValue={1}
          >
            {[...Array(12)].map((_, i) => (
              <option key={i+1} value={i+1}>
                {i+1} {i === 0 ? 'mes' : 'meses'} (${(i+1) * 500} MXN)
              </option>
            ))}
          </select>
        </div>
      )}
    </div>
  );

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-6">
          {isEditMode ? 'Editar Rifa' : 'Crear Nueva Rifa'}
        </h2>
      </div>
      
      {/* Basic Information */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h3 className="text-lg font-semibold mb-4">Información Básica</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Título de la Rifa*
            </label>
            <input
              type="text"
              {...register('title')}
              className="w-full p-2 border border-gray-300 rounded-md"
              placeholder="Ej. Rifa de iPhone 13 Pro"
            />
            {errors.title && (
              <p className="mt-1 text-sm text-red-600">{errors.title.message}</p>
            )}
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Fecha del Sorteo*
            </label>
            <input
              type="date"
              {...register('drawDate')}
              min={tomorrowFormatted}
              className="w-full p-2 border border-gray-300 rounded-md"
            />
            {errors.drawDate && (
              <p className="mt-1 text-sm text-red-600">{errors.drawDate.message}</p>
            )}
          </div>
        </div>
        
        <div className="mt-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Descripción de la Rifa*
          </label>
          <textarea
            {...register('description')}
            rows={4}
            className="w-full p-2 border border-gray-300 rounded-md"
            placeholder="Describe los detalles del sorteo, reglas, etc."
          ></textarea>
          {errors.description && (
            <p className="mt-1 text-sm text-red-600">{errors.description.message}</p>
          )}
        </div>
      </div>
      
      {/* Prize Information */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h3 className="text-lg font-semibold mb-4">Información del Premio</h3>
        
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Descripción del Premio*
          </label>
          <textarea
            {...register('prizeDescription')}
            rows={3}
            className="w-full p-2 border border-gray-300 rounded-md"
            placeholder="Describe el premio detalladamente"
          ></textarea>
          {errors.prizeDescription && (
            <p className="mt-1 text-sm text-red-600">{errors.prizeDescription.message}</p>
          )}
        </div>
        
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Imagen Principal del Premio*
          </label>
          <input
            type="file"
            accept="image/*"
            onChange={handleMainImageChange}
            className="w-full p-2 border border-gray-300 rounded-md"
          />
          <input
            type="hidden"
            {...register('image')}
          />
          
          {mainImagePreview && (
            <div className="mt-2">
              <div className="relative h-40 w-40">
                <Image
                  src={mainImagePreview}
                  alt="Vista previa"
                  fill
                  className="object-cover rounded-md"
                />
              </div>
            </div>
          )}
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Imágenes Adicionales del Premio
          </label>
          <input
            type="file"
            accept="image/*"
            onChange={handlePrizeImagesChange}
            multiple
            className="w-full p-2 border border-gray-300 rounded-md"
          />
          <input
            type="hidden"
            {...register('prizeImages')}
          />
          
          {prizeImagePreviews.length > 0 && (
            <div className="mt-2 grid grid-cols-3 gap-2">
              {prizeImagePreviews.map((preview, index) => (
                <div key={index} className="relative h-24 w-24">
                  <Image
                    src={preview}
                    alt={`Vista previa ${index + 1}`}
                    fill
                    className="object-cover rounded-md"
                  />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      
      {/* Ticket Information */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h3 className="text-lg font-semibold mb-4">Información de Boletos</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Número Total de Boletos*
            </label>
            <input
              type="number"
              {...register('totalTickets', { valueAsNumber: true })}
              min="1"
              className="w-full p-2 border border-gray-300 rounded-md"
            />
            {errors.totalTickets && (
              <p className="mt-1 text-sm text-red-600">{errors.totalTickets.message}</p>
            )}
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Precio por Boleto (MXN)*
            </label>
            <input
              type="number"
              {...register('ticketPrice', { valueAsNumber: true })}
              min="1"
              step="0.01"
              className="w-full p-2 border border-gray-300 rounded-md"
            />
            {errors.ticketPrice && (
              <p className="mt-1 text-sm text-red-600">{errors.ticketPrice.message}</p>
            )}
          </div>
        </div>
        
        <div className="mt-4">
          <div className="flex items-center">
            <input
              type="checkbox"
              id="applyDiscount"
              {...register('applyDiscount')}
              className="h-4 w-4 text-blue-600 border-gray-300 rounded"
            />
            <label htmlFor="applyDiscount" className="ml-2 block text-sm text-gray-700">
              Aplicar descuento
            </label>
          </div>
          
          {applyDiscount && (
            <div className="mt-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Porcentaje de Descuento (%)
              </label>
              <input
                type="number"
                {...register('discountPercentage', { valueAsNumber: true })}
                min="0"
                max="100"
                step="0.01"
                className="w-full p-2 border border-gray-300 rounded-md"
              />
              {errors.discountPercentage && (
                <p className="mt-1 text-sm text-red-600">{errors.discountPercentage.message}</p>
              )}
            </div>
          )}
          
          {discountedPrice !== null && (
            <div className="mt-2">
              <p className="text-sm text-gray-700">
                Precio con descuento: <span className="font-semibold">${discountedPrice.toFixed(2)} MXN</span>
              </p>
            </div>
          )}
        </div>
        
        {renderPromotionSection()}
      </div>
      
      <div className="bg-blue-50 p-6 rounded-lg border border-blue-100">
        <h3 className="text-lg font-semibold text-blue-800 mb-4">Resumen de Costos</h3>
        
        {priceBreakdown.isFreeRaffle ? (
          <div className="bg-green-50 p-4 rounded-md border border-green-200">
            <div className="flex items-center">
              <svg className="h-5 w-5 text-green-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span className="font-medium text-green-700">¡Rifa gratuita!</span>
            </div>
            <p className="text-sm text-green-600 mt-1">
              Esta rifa es gratuita porque es tu primera rifa activa y tiene 100 boletos o menos.
            </p>
          </div>
        ) : (
          <div className="space-y-2 mb-4">
            <div className="flex justify-between items-center">
              <span className="text-gray-700">Tarifa fija:</span>
              <span className="font-medium">${priceBreakdown.fixedFee.toFixed(2)} MXN</span>
            </div>
            
            <div className="flex justify-between items-center">
              <span className="text-gray-700">Comisión por boletos:</span>
              <span className="font-medium">${priceBreakdown.ticketBasedCommission.toFixed(2)} MXN</span>
            </div>
            
            {isPromoted && (
              <div className="flex justify-between items-center">
                <span className="text-gray-700">Promoción ({promotionMonths} {promotionMonths === 1 ? 'mes' : 'meses'}):</span>
                <span className="font-medium">${priceBreakdown.promotionPrice.toFixed(2)} MXN</span>
              </div>
            )}
            
            <div className="border-t border-blue-200 pt-2 mt-2">
              <div className="flex justify-between font-semibold text-lg">
                <span className="text-blue-800">Costo Total:</span>
                <span className="text-blue-800">${priceBreakdown.totalPrice.toFixed(2)} MXN</span>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                {userActiveRaffles === null ? 
                  "Cargando información..." : 
                  "Este monto será cobrado al finalizar la creación de la rifa."}
              </p>
            </div>
          </div>
        )}
      </div>
      
      <div className="flex justify-end">
        <button
          type="submit"
          className="px-6 py-2 bg-blue-600 text-white font-semibold rounded-md shadow-md hover:bg-blue-700"
        >
          {isEditMode ? 'Guardar Cambios' : priceBreakdown.isFreeRaffle ? 'Crear Rifa Gratuita' : 'Crear Rifa'}
        </button>
      </div>
    </form>
  );
}