import { v2 as cloudinary } from 'cloudinary';
import { UploadApiOptions, UploadApiResponse } from 'cloudinary';

// Define result interface for better type checking
interface CloudinaryUploadResult {
  secure_url: string;
  public_id: string;
  asset_id?: string;
  version_id?: string;
  format?: string;
  width?: number;
  height?: number;
  [key: string]: any;
}

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true
});

/**
 * Uploads an image buffer to Cloudinary
 * @param fileBuffer The file buffer to upload
 * @param options Additional upload options
 * @returns The Cloudinary upload result
 */
export async function uploadToCloudinary(fileBuffer: Buffer, options: Partial<UploadApiOptions> = {}): Promise<CloudinaryUploadResult> {
  try {
    // Convert Buffer to base64
    const fileStr = fileBuffer.toString('base64');
    const base64File = `data:image/jpeg;base64,${fileStr}`;
    
    // Set default upload options with proper type for resource_type
    const uploadOptions: UploadApiOptions = {
      folder: 'rifas',
      resource_type: 'image', // Now correctly typed as one of the allowed values
      ...options
    };
    
    // Upload to Cloudinary
    const uploadResponse = await new Promise<CloudinaryUploadResult>((resolve, reject) => {
      cloudinary.uploader.upload(base64File, uploadOptions, (error, result) => {
        if (error) reject(error);
        else resolve(result as CloudinaryUploadResult);
      });
    });
    
    console.log('Image uploaded to Cloudinary successfully');
    return uploadResponse;
  } catch (error) {
    console.error('Error uploading to Cloudinary:', error);
    throw error;
  }
}

/**
 * Deletes an image from Cloudinary by public ID
 * @param publicId The public ID of the image to delete
 * @returns The Cloudinary deletion result
 */
export async function deleteFromCloudinary(publicId: string) {
  try {
    const result = await cloudinary.uploader.destroy(publicId);
    return result;
  } catch (error) {
    console.error('Error deleting from Cloudinary:', error);
    throw error;
  }
}

export default cloudinary;
