import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import Image from 'next/image';

export default function CreateRaffle() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    totalTickets: 100,
    price: 0,
    startDate: new Date().toISOString().split('T')[0], // Fecha actual como valor predeterminado
    endDate: '', // Fecha futura
    winnerSelectionMethod: 'random', // Por defecto aleatoriedad
    lotteryDate: '',
    lotteryDrawNumber: '',
    images: [] as File[],
    socialLinks: {
      whatsapp: '',
      instagram: '',
      twitter: '',
      facebook: ''
    },
    isPromoted: false,
    promotionMonths: 1,
    promoCode: '',
    applyDiscount: false,
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  const [showLotteryFields, setShowLotteryFields] = useState(false);
  const [userActiveRaffles, setUserActiveRaffles] = useState<number | null>(null);
  const [cloudinaryImages, setCloudinaryImages] = useState<Array<{url: string, publicId: string}>>([]);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push('/auth/signin');
    }
  }, [status, router]);

  // Efecto para mostrar/ocultar campos específicos para la lotería
  useEffect(() => {
    setShowLotteryFields(formData.winnerSelectionMethod === 'lottery');
  }, [formData.winnerSelectionMethod]);

  // Add a function to check the user's active raffles
  useEffect(() => {
    if (session?.user) {
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
    }
  }, [session]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 5) {
      setError('Máximo 5 imágenes permitidas');
      return;
    }

    // Create preview URLs immediately for better UI feedback
    const urls = files.map(file => URL.createObjectURL(file));
    setPreviewUrls(urls);
    
    setFormData(prev => ({ ...prev, images: files }));
    
    // Upload images to Cloudinary
    const uploadImagesToCloudinary = async () => {
      try {
        setLoading(true); // Show loading state while uploading
        const formData = new FormData();
        files.forEach(file => formData.append('images', file));

        const response = await fetch('/api/upload/cloudinary', {
          method: 'POST',
          body: formData,
        });

        const data = await response.json();
        
        if (!response.ok) {
          console.error('Error uploading images:', data.message);
          setError('Error al subir imágenes: ' + data.message);
          return;
        }

        // Images uploaded successfully to Cloudinary
        console.log('Images uploaded successfully:', data.cloudinaryImages);
        
        // Store the Cloudinary images in local state for submission
        if (data.cloudinaryImages && data.cloudinaryImages.length > 0) {
          // Save the Cloudinary image URLs in your state
          setCloudinaryImages(data.cloudinaryImages);
        }
        
        // Even if user association failed, we can still use the images
        if (data.userNotFound || data.saveError) {
          console.log('Images uploaded but not saved to user profile - will use them directly.');
        }
        
        // If successful but no preview exists, create them again
        if (previewUrls.length === 0) {
          const urls = files.map(file => URL.createObjectURL(file));
          setPreviewUrls(urls);
        }
      } catch (err) {
        console.error('Error during image upload:', err);
        setError('Error al subir imágenes. Inténtalo de nuevo.');
      } finally {
        setLoading(false);
      }
    };

    uploadImagesToCloudinary();
  };

  const handleSocialLinkChange = (network: keyof typeof formData.socialLinks, value: string) => {
    setFormData(prev => ({
      ...prev,
      socialLinks: {
        ...prev.socialLinks,
        [network]: value
      }
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // Validate images
    if (formData.images.length === 0 && cloudinaryImages.length === 0) {
      setError('Debes subir al menos una imagen');
      setLoading(false);
      return;
    }

    // Validate other required fields
    if (!formData.title?.trim()) {
      setError('El título es obligatorio');
      setLoading(false);
      return;
    }

    if (!formData.description?.trim()) {
      setError('La descripción es obligatoria');
      setLoading(false);
      return;
    }

    if (!formData.price || formData.price <= 0) {
      setError('El precio por boleto debe ser mayor a 0');
      setLoading(false);
      return;
    }

    if (!formData.totalTickets || formData.totalTickets <= 0) {
      setError('El número de boletos debe ser mayor a 0');
      setLoading(false);
      return;
    }

    // Validar fechas
    if (new Date(formData.startDate) > new Date(formData.endDate)) {
      setError('La fecha de fin debe ser posterior a la fecha de inicio');
      setLoading(false);
      return;
    }

    // Validar campos específicos para lotería
    if (formData.winnerSelectionMethod === 'lottery' && (!formData.lotteryDate || !formData.lotteryDrawNumber)) {
      setError('Para método de lotería, debes especificar fecha y número de sorteo');
      setLoading(false);
      return;
    }

    try {
      const formDataObj = new FormData();
      
      // Add all text fields to form data
      Object.entries(formData).forEach(([key, value]) => {
        if (key !== 'images' && key !== 'socialLinks') {
          formDataObj.append(key, value.toString());
        }
      });
      
      // Add social links as JSON
      formDataObj.append('socialLinks', JSON.stringify(formData.socialLinks));
      
      // Add Cloudinary image URLs if we have them
      if (cloudinaryImages.length > 0) {
        formDataObj.append('cloudinaryImages', JSON.stringify(cloudinaryImages));
      }
      
      // Only add raw image files if we don't have Cloudinary images
      if (cloudinaryImages.length === 0) {
        formData.images.forEach((image) => {
          formDataObj.append('images', image);
        });
      }

      // Ensure price is included as a number
      formDataObj.append('price', formData.price.toString());

      const res = await fetch('/api/raffles/create', {
        method: 'POST',
        body: formDataObj,
      });

      // Parse the JSON response ONCE and store it
      const data = await res.json();

      // Now check if the response was successful
      if (!res.ok) {
        // We already have the parsed data, no need to call res.json() again
        if (data.validationErrors && data.validationErrors.length > 0) {
          throw new Error(`Error en la validación: ${data.validationErrors.join(", ")}`);
        } else {
          throw new Error(data.message || 'Error al crear la rifa');
        }
      }

      // Use the parsed data for successful responses
      if (data.url) {
        window.location.href = data.url;
      } else {
        router.push('/dashboard');
      }
    } catch (error) {
      console.error('Raffle creation error:', error);
      setError(error instanceof Error ? error.message : 'Error al crear la rifa');
    } finally {
      setLoading(false);
    }
  };

  // Limpiar URLs de vista previa al desmontar
  useEffect(() => {
    return () => {
      previewUrls.forEach(url => URL.revokeObjectURL(url));
    };
  }, [previewUrls]);

  // Add price calculation function
  const calculateTotalPrice = () => {
    // Check if user is eligible for a free raffle
    const isFreeRaffle = userActiveRaffles === 0 && formData.totalTickets <= 100;
    
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
    
    // Otherwise, calculate regular price
    // Fixed fee for creating a raffle
    const fixedFee = 20; // 20 MXN
    
    // Calculate ticket-based commission rate
    let ticketCommissionRate = 0;
    let commissionPerTenTickets = 0;
    
    if (formData.totalTickets <= 100) {
      commissionPerTenTickets = 1.00; // $1 per 10 tickets for small raffles
    } else if (formData.totalTickets <= 1000) {
      commissionPerTenTickets = 0.80; // $0.80 per 10 tickets for medium raffles
    } else if (formData.totalTickets <= 10000) {
      commissionPerTenTickets = 0.70; // $0.70 per 10 tickets for larger raffles
    } else if (formData.totalTickets <= 50000) {
      commissionPerTenTickets = 0.50; // $0.50 per 10 tickets for very large raffles
    } else if (formData.totalTickets <= 1000000) {
      commissionPerTenTickets = 0.30; // $0.30 per 10 tickets for massive raffles
    } else {
      // For extremely large raffles, charge per individual ticket
      ticketCommissionRate = 0.01; // $0.01 per ticket
    }
    
    // Calculate total ticket-based commission
    const ticketsInTens = Math.ceil(formData.totalTickets / 10);
    const ticketBasedCommission = ticketCommissionRate > 0 
      ? formData.totalTickets * ticketCommissionRate 
      : ticketsInTens * commissionPerTenTickets;
    
    // Promotion price (if applicable)
    const promotionPrice = formData.isPromoted ? 500 * formData.promotionMonths : 0; // 500 MXN per month
    
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

  // Get price breakdown
  const priceBreakdown = calculateTotalPrice();

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (!session) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-yellow-400 via-red-500 to-pink-600 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <div className="bg-white/90 backdrop-blur-md p-8 rounded-lg shadow-xl">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">Crear Nueva Rifa</h1>
          
          {/* Free raffle notification */}
          {userActiveRaffles === 0 && (
            <div className="bg-green-100 border-l-4 border-green-500 text-green-700 p-4 mb-6">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm">
                    <span className="font-medium">¡Tu primera rifa es gratis!</span> Puedes crear una rifa de hasta 100 boletos sin costo.
                  </p>
                </div>
              </div>
            </div>
          )}
          
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative">
                {error}
              </div>
            )}

            <div>
              <label htmlFor="title" className="block text-sm font-semibold text-gray-900">
                Título de la Rifa
              </label>
              <input
                type="text"
                id="title"
                required
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 bg-white text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Ingresa el título de tu rifa"
              />
            </div>

            <div>
              <label htmlFor="description" className="block text-sm font-semibold text-gray-900">
                Descripción
              </label>
              <textarea
                id="description"
                required
                rows={4}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 bg-white text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Describe los detalles de tu rifa"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="totalTickets" className="block text-sm font-semibold text-gray-900">
                  Número de Boletos
                </label>
                <input
                  type="number"
                  id="totalTickets"
                  required
                  min="1"
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 bg-white text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  value={formData.totalTickets}
                  onChange={(e) => setFormData({ ...formData, totalTickets: parseInt(e.target.value) })}
                  placeholder="Ej: 100"
                />
              </div>

              <div>
                <label htmlFor="price" className="block text-sm font-semibold text-gray-900">
                  Precio por Boleto (MXN)
                </label>
                <input
                  type="number"
                  id="price"
                  required
                  min="0"
                  step="0.01"
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 bg-white text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) })}
                  placeholder="Ej: 50.00"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="startDate" className="block text-sm font-semibold text-gray-900">
                  Fecha de Inicio
                </label>
                <input
                  type="date"
                  id="startDate"
                  required
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 bg-white text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  value={formData.startDate}
                  onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                />
              </div>

              <div>
                <label htmlFor="endDate" className="block text-sm font-semibold text-gray-900">
                  Fecha de Finalización
                </label>
                <input
                  type="date"
                  id="endDate"
                  required
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 bg-white text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  value={formData.endDate}
                  onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                />
              </div>
            </div>

            <div>
              <label htmlFor="winnerSelectionMethod" className="block text-sm font-semibold text-gray-900">
                Método de Selección del Ganador
              </label>
              <select
                id="winnerSelectionMethod"
                required
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 bg-white text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                value={formData.winnerSelectionMethod}
                onChange={(e) => setFormData({ ...formData, winnerSelectionMethod: e.target.value })}
              >
                <option value="random">Selección Aleatoria</option>
                <option value="lottery">Basado en Lotería Nacional</option>
                <option value="manual">Selección Manual por el Creador</option>
              </select>
            </div>

            {showLotteryFields && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="lotteryDate" className="block text-sm font-semibold text-gray-900">
                    Fecha del Sorteo de Lotería
                  </label>
                  <input
                    type="date"
                    id="lotteryDate"
                    required={formData.winnerSelectionMethod === 'lottery'}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 bg-white text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                    value={formData.lotteryDate}
                    onChange={(e) => setFormData({ ...formData, lotteryDate: e.target.value })}
                  />
                </div>

                <div>
                  <label htmlFor="lotteryDrawNumber" className="block text-sm font-semibold text-gray-900">
                    Número del Sorteo
                  </label>
                  <input
                    type="text"
                    id="lotteryDrawNumber"
                    required={formData.winnerSelectionMethod === 'lottery'}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 bg-white text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                    value={formData.lotteryDrawNumber}
                    onChange={(e) => setFormData({ ...formData, lotteryDrawNumber: e.target.value })}
                    placeholder="Ej: 1234"
                  />
                </div>
              </div>
            )}

            <div>
              <label htmlFor="promoCode" className="block text-sm font-semibold text-gray-900">
                Código Promocional (opcional)
              </label>
              <input
                type="text"
                id="promoCode"
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 bg-white text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                value={formData.promoCode}
                onChange={(e) => setFormData({ ...formData, promoCode: e.target.value })}
                placeholder="Si tienes un código promocional, ingrésalo aquí"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-2">
                Imágenes (Máximo 5)
              </label>
              <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md hover:border-indigo-500 transition-colors">
                <div className="space-y-1 text-center">
                  <svg
                    className="mx-auto h-12 w-12 text-gray-400"
                    stroke="currentColor"
                    fill="none"
                    viewBox="0 0 48 48"
                    aria-hidden="true"
                  >
                    <path
                      d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                      strokeWidth={2}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                  <div className="flex text-sm text-gray-600">
                    <label
                      htmlFor="images"
                      className="relative cursor-pointer bg-white rounded-md font-medium text-indigo-600 hover:text-indigo-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-indigo-500"
                    >
                      <span>Sube tus imágenes</span>
                      <input
                        id="images"
                        name="images"
                        type="file"
                        className="sr-only"
                        multiple
                        accept="image/*"
                        onChange={handleImageChange}
                      />
                    </label>
                  </div>
                  <p className="text-xs text-gray-500">PNG, JPG, GIF hasta 10MB</p>
                </div>
              </div>

              {previewUrls.length > 0 ? (
                <div className="mt-4 grid grid-cols-2 md:grid-cols-3 gap-4">
                  {previewUrls.map((url, index) => (
                    <div key={index} className="relative aspect-w-16 aspect-h-9 border border-gray-300 rounded-lg overflow-hidden">
                      <Image
                        src={url}
                        alt={`Vista previa ${index + 1}`}
                        fill
                        className="object-cover"
                        sizes="(max-width: 768px) 100vw, 33vw"
                      />
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500 mt-2">No hay imágenes seleccionadas</p>
              )}
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900">Redes Sociales (opcional)</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="whatsapp" className="block text-sm font-semibold text-gray-900">
                    WhatsApp
                  </label>
                  <input
                    type="text"
                    id="whatsapp"
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 bg-white text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                    value={formData.socialLinks.whatsapp}
                    onChange={(e) => handleSocialLinkChange('whatsapp', e.target.value)}
                    placeholder="Número de WhatsApp"
                  />
                </div>

                <div>
                  <label htmlFor="instagram" className="block text-sm font-semibold text-gray-900">
                    Instagram
                  </label>
                  <input
                    type="text"
                    id="instagram"
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 bg-white text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                    value={formData.socialLinks.instagram}
                    onChange={(e) => handleSocialLinkChange('instagram', e.target.value)}
                    placeholder="@usuario"
                  />
                </div>

                <div>
                  <label htmlFor="facebook" className="block text-sm font-semibold text-gray-900">
                    Facebook
                  </label>
                  <input
                    type="text"
                    id="facebook"
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 bg-white text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                    value={formData.socialLinks.facebook}
                    onChange={(e) => handleSocialLinkChange('facebook', e.target.value)}
                    placeholder="URL de Facebook"
                  />
                </div>

                <div>
                  <label htmlFor="twitter" className="block text-sm font-semibold text-gray-900">
                    Twitter
                  </label>
                  <input
                    type="text"
                    id="twitter"
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 bg-white text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                    value={formData.socialLinks.twitter}
                    onChange={(e) => handleSocialLinkChange('twitter', e.target.value)}
                    placeholder="@usuario"
                  />
                </div>
              </div>
            </div>

            <div className="flex flex-col bg-indigo-50 p-4 rounded-lg">
              <div className="flex items-center mb-4">
                <input
                  type="checkbox"
                  id="isPromoted"
                  className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                  checked={formData.isPromoted}
                  onChange={(e) => setFormData({ ...formData, isPromoted: e.target.checked })}
                />
                <label htmlFor="isPromoted" className="ml-2 block text-sm text-gray-900">
                  Promocionar en la página principal (500 MXN por mes)
                </label>
              </div>
              
              {formData.isPromoted && (
                <div className="ml-6">
                  <label htmlFor="promotionMonths" className="block text-sm font-medium text-gray-700 mb-2">
                    Duración de la promoción (meses)
                  </label>
                  <select
                    id="promotionMonths"
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3"
                    value={formData.promotionMonths}
                    onChange={(e) => setFormData({ ...formData, promotionMonths: parseInt(e.target.value) })}
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

            {/* Ticket Information */}
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h3 className="text-lg font-semibold mb-4">Información de Boletos</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="totalTickets" className="block text-sm font-semibold text-gray-900">
                    Número Total de Boletos*
                  </label>
                  <input
                    type="number"
                    id="totalTickets"
                    required
                    min="1"
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 bg-white text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                    value={formData.totalTickets}
                    onChange={(e) => setFormData({ ...formData, totalTickets: parseInt(e.target.value) })}
                    placeholder="Ej: 100"
                  />
                </div>
                
                <div>
                  <label htmlFor="price" className="block text-sm font-semibold text-gray-900">
                    Precio por Boleto (MXN)*
                  </label>
                  <input
                    type="number"
                    id="price"
                    required
                    min="0"
                    step="0.01"
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 bg-white text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) })}
                    placeholder="Ej: 50.00"
                  />
                </div>
              </div>
              
              {/* New pricing information section */}
              <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                <h4 className="text-sm font-semibold text-blue-800 mb-2">Información sobre tarifas</h4>
                <p className="text-sm text-blue-700 mb-2">
                  La tarifa por crear una rifa incluye:
                </p>
                <ul className="list-disc pl-5 text-sm text-blue-700 mb-3 space-y-1">
                  <li>Tarifa fija de $20 MXN por crear una rifa</li>
                  <li>Comisión del 10% sobre el valor total de los boletos</li>
                  <li>Tarifa por volumen de boletos:</li>
                </ul>
                <table className="w-full text-sm text-blue-700">
                  <thead>
                    <tr className="border-b border-blue-200">
                      <th className="text-left py-1">Cantidad de boletos</th>
                      <th className="text-right py-1">Tarifa</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b border-blue-100">
                      <td className="py-1">1 a 100 boletos</td>
                      <td className="text-right">$1.00 por cada 10 boletos</td>
                    </tr>
                    <tr className="border-b border-blue-100">
                      <td className="py-1">101 a 1,000 boletos</td>
                      <td className="text-right">$0.80 por cada 10 boletos</td>
                    </tr>
                    <tr className="border-b border-blue-100">
                      <td className="py-1">1,001 a 10,000 boletos</td>
                      <td className="text-right">$0.70 por cada 10 boletos</td>
                    </tr>
                    <tr className="border-b border-blue-100">
                      <td className="py-1">10,001 a 50,000 boletos</td>
                      <td className="text-right">$0.50 por cada 10 boletos</td>
                    </tr>
                    <tr className="border-b border-blue-100">
                      <td className="py-1">50,001 a 1,000,000 boletos</td>
                      <td className="text-right">$0.30 por cada 10 boletos</td>
                    </tr>
                    <tr>
                      <td className="py-1">Más de 1,000,000 boletos</td>
                      <td className="text-right">$0.01 por boleto</td>
                    </tr>
                  </tbody>
                </table>
                {formData.isPromoted && (
                  <p className="mt-3 text-sm text-blue-700">
                    Promoción en página principal: +$400 MXN
                  </p>
                )}
              </div>

              <div className="mt-4">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="applyDiscount"
                    checked={formData.applyDiscount}
                    onChange={(e) => setFormData({ ...formData, applyDiscount: e.target.checked })}
                    className="h-4 w-4 text-blue-600 border-gray-300 rounded"
                  />
                  <label htmlFor="applyDiscount" className="ml-2 block text-sm text-gray-700">
                    Aplicar descuento
                  </label>
                </div>
              </div>
            </div>

            {/* Add price summary section before submit button */}
            <div className="bg-blue-50 p-6 rounded-lg shadow-md border border-blue-100">
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
                  <div className="flex justify-between">
                    <span className="text-gray-700">Tarifa fija:</span>
                    <span className="font-medium">${priceBreakdown.fixedFee.toFixed(2)} MXN</span>
                  </div>
                  
                  <div className="flex justify-between">
                    <span className="text-gray-700">Comisión por boletos:</span>
                    <span className="font-medium">${priceBreakdown.ticketBasedCommission.toFixed(2)} MXN</span>
                  </div>
                  
                  {formData.isPromoted && (
                    <div className="flex justify-between">
                      <span className="text-gray-700">Promoción ({formData.promotionMonths} {formData.promotionMonths === 1 ? 'mes' : 'meses'}):</span>
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
                disabled={loading}
                className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-6 py-2 rounded-md hover:from-indigo-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 transition-all duration-200 transform hover:scale-105"
              >
                {loading ? 'Creando...' : priceBreakdown.isFreeRaffle ? 'Crear Rifa Gratuita' : 'Crear Rifa'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}