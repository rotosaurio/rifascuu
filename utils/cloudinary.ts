import { v2 as cloudinary } from 'cloudinary';

// Configurar Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

/**
 * Sube una imagen a Cloudinary desde un string base64
 * @param base64Image - Imagen en formato base64
 * @param folder - Carpeta donde guardar la imagen (opcional)
 * @returns URL de la imagen cargada en Cloudinary
 */
export const uploadImage = async (
  base64Image: string,
  folder: string = 'rifas'
): Promise<{ url: string; publicId: string }> => {
  try {
    // Si la imagen ya tiene el prefijo data:image, la usamos directamente
    const imageToUpload = base64Image.startsWith('data:') 
      ? base64Image 
      : `data:image/jpeg;base64,${base64Image}`;
    
    // Subir la imagen a Cloudinary
    const result = await cloudinary.uploader.upload(imageToUpload, {
      folder,
      resource_type: 'image',
      transformation: [
        { width: 800, crop: 'scale' }, // Redimensionar para optimizar
        { quality: 'auto:good' }, // Optimizar calidad automáticamente
      ],
    });
    
    return {
      url: result.secure_url,
      publicId: result.public_id,
    };
  } catch (error) {
    console.error('Error al subir imagen a Cloudinary:', error);
    throw new Error('Error al subir imagen a Cloudinary');
  }
};

/**
 * Elimina una imagen de Cloudinary por su public_id
 * @param publicId - ID público de la imagen en Cloudinary
 */
export const deleteImage = async (publicId: string): Promise<void> => {
  try {
    await cloudinary.uploader.destroy(publicId);
  } catch (error) {
    console.error('Error al eliminar imagen de Cloudinary:', error);
    throw new Error('Error al eliminar imagen de Cloudinary');
  }
};

export default cloudinary; 