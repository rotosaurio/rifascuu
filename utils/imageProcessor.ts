import sharp from 'sharp';
import { uploadImage } from './cloudinary';

// Función obsoleta - solo para compatibilidad
export async function optimizeImage(buffer: Buffer) {
  try {
    // Procesamos la imagen con sharp para optimizarla
    const processedImage = await sharp(buffer)
      .resize(600, 600, {
        fit: 'inside',
        withoutEnlargement: true
      })
      .jpeg({ quality: 65 })
      .toBuffer();

    // Convertimos a base64 (sin prefijo)
    const base64String = processedImage.toString('base64');
    
    console.log('Imagen procesada correctamente (método obsoleto)');
    console.log('Longitud del base64:', base64String.length);
    
    // Devolvemos un objeto con la data y el contentType
    return {
      data: base64String,
      contentType: 'image/jpeg'
    };
  } catch (error) {
    console.error('Error al procesar imagen:', error);
    throw new Error('Error al procesar la imagen');
  }
}

// Función principal para procesar y subir imágenes a Cloudinary
export async function processAndUploadImage(buffer: Buffer, folder: string = 'rifas') {
  try {
    // Procesamos la imagen con sharp para optimizarla antes de subir
    const processedImage = await sharp(buffer)
      .resize(800, 800, {
        fit: 'inside',
        withoutEnlargement: true
      })
      .jpeg({ quality: 80 })
      .toBuffer();

    // Convertimos a base64 para subir a Cloudinary
    const base64String = processedImage.toString('base64');
    const base64Image = `data:image/jpeg;base64,${base64String}`;
    
    // Subimos a Cloudinary
    const cloudinaryResult = await uploadImage(base64Image, folder);
    
    console.log('Imagen procesada y subida a Cloudinary:', cloudinaryResult.url);
    
    // Devolvemos solo la información de Cloudinary
    return {
      url: cloudinaryResult.url,
      publicId: cloudinaryResult.publicId
    };
  } catch (error) {
    console.error('Error al procesar y subir imagen:', error);
    throw new Error('Error al procesar y subir la imagen');
  }
} 