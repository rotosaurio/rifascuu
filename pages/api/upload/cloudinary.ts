import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import { IncomingForm } from 'formidable';
import { uploadToCloudinary } from '@/lib/cloudinary';
import { promises as fs } from 'fs';
import { Types } from 'mongoose'; // Add mongoose Types import

// Disable the default body parser to handle file uploads
export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // Only allow POST method
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method Not Allowed' });
  }

  try {
    // Get the user session
    const session = await getServerSession(req, res, authOptions);
    if (!session || !session.user) {
      return res.status(401).json({ success: false, message: 'Not authenticated' });
    }
    
    // Log the user ID we're trying to use
    console.log('Session user ID:', session.user.id);
    
    // Ensure the user ID is in the correct format for MongoDB
    let userId;
    try {
      // Only convert to ObjectId if it's not already one
      userId = Types.ObjectId.isValid(session.user.id) 
        ? new Types.ObjectId(session.user.id) 
        : session.user.id;
      console.log('Formatted user ID:', userId);
    } catch (error) {
      console.error('Error formatting user ID:', error);
      // Fall back to the original ID if there's an error
      userId = session.user.id;
    }

    // Connect to database
    await connectDB();

    // Parse the form with uploaded files
    const form = new IncomingForm({
      keepExtensions: true,
      maxFileSize: 10 * 1024 * 1024, // 10MB limit
      multiples: true, // Ensure multiple files are handled correctly
    });

    console.log('Parsing form data...');
    
    const [fields, files] = await new Promise<[any, any]>((resolve, reject) => {
      form.parse(req, (err, fields, files) => {
        if (err) {
          console.error("Form parsing error:", err);
          reject(err);
        }
        resolve([fields, files]);
      });
    });

    // Better logging for debugging files
    console.log('Files received:', files ? 'Yes' : 'No');
    if (files) {
      const imageFiles = files.images ? (Array.isArray(files.images) ? files.images : [files.images]) : [];
      console.log(`Number of images received: ${imageFiles.length}`);
      if (imageFiles.length > 0) {
        console.log('First image filename:', imageFiles[0].originalFilename);
        console.log('First image size:', imageFiles[0].size);
      }
    }

    // Handle files upload to Cloudinary
    const uploadedImages = [];
    
    // Ensure files.images is correctly handled whether it's an array or a single file
    const imageFiles = files && files.images 
      ? (Array.isArray(files.images) ? files.images : [files.images])
      : [];
      
    console.log(`Processing ${imageFiles.length} images`);
    
    for (const file of imageFiles) {
      console.log(`Processing image: ${file.originalFilename}`);
      
      try {
        // Read file from temp location
        const fileContent = await fs.readFile(file.filepath);
        
        // Upload to Cloudinary
        const uploadResult = await uploadToCloudinary(fileContent);
        
        if (uploadResult && uploadResult.secure_url) {
          console.log(`Image processed and uploaded to Cloudinary: ${uploadResult.secure_url}`);
          uploadedImages.push({
            url: uploadResult.secure_url,
            publicId: uploadResult.public_id,
          });
        }
      } catch (uploadError) {
        console.error(`Error uploading image to Cloudinary:`, uploadError);
      } finally {
        // Clean up temp file
        await fs.unlink(file.filepath).catch(err => console.error('Error deleting temp file:', err));
      }
    }
    
    console.log(`Total images uploaded to Cloudinary: ${uploadedImages.length}`);
    
    // If no images were uploaded, return clear error
    if (uploadedImages.length === 0 && imageFiles.length > 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'No se pudieron procesar las imágenes. Inténtalo de nuevo.',
        details: 'Images were received but could not be uploaded to Cloudinary'
      });
    } else if (imageFiles.length === 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'No se recibieron imágenes. Por favor, selecciona al menos una imagen.',
        details: 'No image files were received by the server'
      });
    }
    
    // Save Cloudinary image references to user if needed
    // Note: We'll skip adding to the user model and just return the cloudinary URLs
    // The raffle creation API will handle saving these URLs
    try {
      // First, just do a search to check if user exists before trying to update
      console.log(`Checking if user exists: ${userId}`);
      const userExists = await User.findById(userId).select('_id');
      
      if (!userExists) {
        // User doesn't exist - return the images but with a special flag
        console.log('User not found in database, returning images without saving to user');
        return res.status(200).json({
          success: true,
          message: 'Images uploaded successfully but user not found to save references',
          cloudinaryImages: uploadedImages,
          userNotFound: true
        });
      }
      
      // User exists, proceed with update
      console.log(`Saving Cloudinary images to user: ${userId}`);
      
      // Use findByIdAndUpdate with proper options
      const updateResult = await User.findByIdAndUpdate(
        userId,
        { 
          $set: { cloudinaryTempImages: uploadedImages } 
        },
        { 
          new: true, // Return the updated document
          runValidators: true // Run schema validators
        }
      );
      
      if (!updateResult) {
        console.log('Update result: User not found during update');
        // Still return success since images were uploaded successfully
        return res.status(200).json({ 
          success: true, 
          message: 'Images uploaded successfully but user record could not be updated',
          cloudinaryImages: uploadedImages // Return the images for the frontend to use
        });
      }
      
      console.log(`Cloudinary temp images saved: ${updateResult.cloudinaryTempImages?.length || 0}`);
      
      return res.status(200).json({
        success: true,
        message: 'Images uploaded and saved successfully',
        cloudinaryImages: uploadedImages
      });
      
    } catch (updateError) {
      console.error('Error updating user with Cloudinary images:', updateError);
      
      // Still return the uploaded images even if saving to user failed
      return res.status(200).json({
        success: true,
        message: 'Images uploaded but not saved to user',
        cloudinaryImages: uploadedImages,
        saveError: updateError instanceof Error ? updateError.message : 'Unknown error'
      });
    }
    
  } catch (error) {
    console.error('Error in Cloudinary upload API:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Server error during image upload',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
