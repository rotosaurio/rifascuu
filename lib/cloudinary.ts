import { v2 as cloudinary } from 'cloudinary';

// Configure Cloudinary with environment variables
cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.NEXT_PUBLIC_CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

/**
 * Upload a file to Cloudinary
 * @param file The file to upload
 * @param folder Optional folder path in Cloudinary
 * @returns Promise with the upload result
 */
export const uploadToCloudinary = async (
  file: string | Buffer,
  folder = 'raffles'
) => {
  try {
    const uploadResult = await new Promise((resolve, reject) => {
      const uploadOptions = {
        folder,
        upload_preset: process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET,
        resource_type: 'auto',
      };
      
      cloudinary.uploader.upload(file, uploadOptions, (error, result) => {
        if (error) return reject(error);
        resolve(result);
      });
    });
    
    return uploadResult;
  } catch (error) {
    console.error('Error uploading to Cloudinary:', error);
    throw new Error('Failed to upload image to Cloudinary');
  }
};

/**
 * Delete a file from Cloudinary by public_id
 * @param publicId The public_id of the file to delete
 * @returns Promise with deletion result
 */
export const deleteFromCloudinary = async (publicId: string) => {
  try {
    return await cloudinary.uploader.destroy(publicId);
  } catch (error) {
    console.error('Error deleting from Cloudinary:', error);
    throw new Error('Failed to delete image from Cloudinary');
  }
};

/**
 * Generate a Cloudinary URL with transformations
 * @param publicId The public_id of the image
 * @param options Transformation options
 * @returns URL string with transformations
 */
export const getCloudinaryUrl = (publicId: string, options = {}) => {
  return cloudinary.url(publicId, {
    secure: true,
    ...options
  });
};
