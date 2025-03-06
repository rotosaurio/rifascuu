import { useState } from 'react';
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
      </div>
      
      <div className="flex justify-end">
        <button
          type="submit"
          className="px-6 py-2 bg-blue-600 text-white font-semibold rounded-md shadow-md hover:bg-blue-700"
        >
          {isEditMode ? 'Guardar Cambios' : 'Crear Rifa'}
        </button>
      </div>
    </form>
  );
}