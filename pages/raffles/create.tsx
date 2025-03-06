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
    promoCode: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  const [showLotteryFields, setShowLotteryFields] = useState(false);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push('/auth/signin');
    }
  }, [status, router]);

  // Efecto para mostrar/ocultar campos específicos para la lotería
  useEffect(() => {
    setShowLotteryFields(formData.winnerSelectionMethod === 'lottery');
  }, [formData.winnerSelectionMethod]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 5) {
      setError('Máximo 5 imágenes permitidas');
      return;
    }

    setFormData(prev => ({ ...prev, images: files }));
    
    // Crear URLs de vista previa
    const urls = files.map(file => URL.createObjectURL(file));
    setPreviewUrls(urls);
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

    if (formData.images.length === 0) {
      setError('Debes subir al menos una imagen');
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
      formDataObj.append('title', formData.title);
      formDataObj.append('description', formData.description);
      formDataObj.append('price', formData.price.toString());
      formDataObj.append('totalTickets', formData.totalTickets.toString());
      formDataObj.append('isPromoted', String(formData.isPromoted));
      formDataObj.append('socialLinks', JSON.stringify(formData.socialLinks));
      
      // Añadir nuevos campos
      formDataObj.append('startDate', formData.startDate);
      formDataObj.append('endDate', formData.endDate);
      formDataObj.append('winnerSelectionMethod', formData.winnerSelectionMethod);
      
      // Añadir campos específicos de lotería si corresponde
      if (formData.winnerSelectionMethod === 'lottery') {
        formDataObj.append('lotteryDate', formData.lotteryDate);
        formDataObj.append('lotteryDrawNumber', formData.lotteryDrawNumber);
      }
      
      if (formData.promoCode) {
        formDataObj.append('promoCode', formData.promoCode);
      }

      formData.images.forEach((image) => {
        formDataObj.append('images', image);
      });

      const res = await fetch('/api/raffles/create', {
        method: 'POST',
        body: formDataObj,
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || 'Error al crear la rifa');
      }

      if (data.url) {
        window.location.href = data.url;
      } else {
        router.push('/dashboard');
      }
    } catch (error) {
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

              {previewUrls.length > 0 && (
                <div className="mt-4 grid grid-cols-2 md:grid-cols-3 gap-4">
                  {previewUrls.map((url, index) => (
                    <div key={index} className="relative aspect-w-16 aspect-h-9">
                      <Image
                        src={url}
                        alt={`Preview ${index + 1}`}
                        layout="fill"
                        objectFit="cover"
                        className="rounded-lg"
                      />
                    </div>
                  ))}
                </div>
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

            <div className="flex items-center bg-indigo-50 p-4 rounded-lg">
              <input
                type="checkbox"
                id="isPromoted"
                className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                checked={formData.isPromoted}
                onChange={(e) => setFormData({ ...formData, isPromoted: e.target.checked })}
              />
              <label htmlFor="isPromoted" className="ml-2 block text-sm text-gray-900">
                Promocionar en la página principal (+$400 MXN)
              </label>
            </div>

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={loading}
                className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-6 py-2 rounded-md hover:from-indigo-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 transition-all duration-200 transform hover:scale-105"
              >
                {loading ? 'Creando...' : 'Crear Rifa'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}