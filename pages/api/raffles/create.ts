import type { NextApiRequest, NextApiResponse } from 'next';
import { getSession } from 'next-auth/react';
import connectDB from '../../../lib/mongodb';
import Raffle from '../../../models/Raffle';
import User from '../../../models/User';
import { optimizeImage } from '../../../utils/imageProcessor';
import { IncomingForm } from 'formidable';
import { promises as fs } from 'fs';
import Stripe from 'stripe';
import { Types } from 'mongoose';
import { processAndUploadImage } from '../../../utils/imageProcessor';

interface UserDocument {
  _id: Types.ObjectId;
  // Campos obsoletos
  tempRaffleImages?: Array<{
    data: string;
    contentType: string;
  }>;
  raffleImageTemp?: string[];
  // Campo principal a usar
  cloudinaryTempImages?: Array<{ 
    url: string; 
    publicId: string 
  }>;
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2022-11-15',
});

export const config = {
  api: {
    bodyParser: false,
  },
};

type FormFields = {
  title: string;
  description: string;
  price: string;
  totalTickets: string;
  socialLinks: string;
  isPromoted: string;
  promoCode?: string;
  startDate?: string;
  endDate?: string;
  winnerSelectionMethod?: string;
  lotteryDate?: string;
  lotteryDrawNumber?: string;
};

// Función para analizar el formulario
const parseForm = async (req: NextApiRequest) => {
  return new Promise<{ fields: any; files: any }>((resolve, reject) => {
    const form = new IncomingForm({
      keepExtensions: true,
      multiples: true,
    });

    form.parse(req, (err, fields, files) => {
      if (err) reject(err);
      resolve({ fields, files });
    });
  });
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Método no permitido' });
  }

  try {
    const session = await getSession({ req });
    
    if (!session) {
      return res.status(401).json({ message: 'No autorizado' });
    }

    await connectDB();

    // Analizar el formulario
    const { fields, files } = await parseForm(req);

    // Validar campos
    const formFields: FormFields = {
      title: Array.isArray(fields.title) ? fields.title[0] : fields.title || '',
      description: Array.isArray(fields.description) ? fields.description[0] : fields.description || '',
      price: Array.isArray(fields.price) ? fields.price[0] : fields.price || '',
      totalTickets: Array.isArray(fields.totalTickets) ? fields.totalTickets[0] : fields.totalTickets || '',
      socialLinks: Array.isArray(fields.socialLinks) ? fields.socialLinks[0] : fields.socialLinks || '{}',
      isPromoted: Array.isArray(fields.isPromoted) ? fields.isPromoted[0] : fields.isPromoted || 'false',
      promoCode: Array.isArray(fields.promoCode) ? fields.promoCode[0] : fields.promoCode,
      startDate: Array.isArray(fields.startDate) ? fields.startDate[0] : fields.startDate,
      endDate: Array.isArray(fields.endDate) ? fields.endDate[0] : fields.endDate,
      winnerSelectionMethod: Array.isArray(fields.winnerSelectionMethod) ? fields.winnerSelectionMethod[0] : fields.winnerSelectionMethod || 'random',
      lotteryDate: Array.isArray(fields.lotteryDate) ? fields.lotteryDate[0] : fields.lotteryDate,
      lotteryDrawNumber: Array.isArray(fields.lotteryDrawNumber) ? fields.lotteryDrawNumber[0] : fields.lotteryDrawNumber,
    };

    // Validar campos requeridos
    if (!formFields.title || !formFields.description || !formFields.totalTickets || !formFields.price) {
      return res.status(400).json({ message: 'Todos los campos son requeridos' });
    }

    // Procesar enlaces sociales opcionales
    const parsedSocialLinks = JSON.parse(formFields.socialLinks);

    // Procesar imágenes
    let cloudinaryImages: { url: string; publicId: string }[] = [];
    
    if (files.images) {
      const imageFiles = Array.isArray(files.images) ? files.images : [files.images];
      console.log('Número de imágenes recibidas:', imageFiles.length);
      
      for (const file of imageFiles) {
        if (!file || !file.filepath) continue;
        
        try {
          console.log('Procesando imagen:', file.originalFilename);
          const fileData = await fs.readFile(file.filepath);
          
          // Subir directamente a Cloudinary
          const cloudinaryImageInfo = await processAndUploadImage(fileData);
          cloudinaryImages.push(cloudinaryImageInfo);
          
          console.log('Imagen subida a Cloudinary exitosamente');
        } catch (error) {
          console.error('Error procesando imagen:', error);
          continue;
        } finally {
          // Limpiar archivo temporal
          if (file.filepath) {
            await fs.unlink(file.filepath).catch(console.error);
          }
        }
      }
    } else {
      console.log('No se recibieron imágenes');
    }

    if (cloudinaryImages.length === 0) {
      return res.status(400).json({ message: 'Se requiere al menos una imagen' });
    }

    console.log('Total de imágenes subidas a Cloudinary:', cloudinaryImages.length);

    // Calcular costo total
    let totalCost = 99; // Costo base
    if (formFields.isPromoted === 'true') {
      totalCost += 250; // Costo adicional para rifas promocionadas
    }

    // Verificar si es una rifa gratuita (usando código promocional)
    if (formFields.promoCode) {
      const user = await User.findById(session.user.id);
      if (!user || user.freeRafflesCount === 0) {
        return res.status(400).json({ message: 'No tienes rifas gratuitas disponibles' });
      }

      // Crear la rifa sin pago
      const raffle = await Raffle.create({
        title: formFields.title,
        description: formFields.description,
        ticketPrice: parseFloat(formFields.price),
        totalTickets: parseInt(formFields.totalTickets),
        images: cloudinaryImages,
        socialLinks: parsedSocialLinks,
        creator: session.user.id,
        isPromoted: formFields.isPromoted === 'true',
        status: 'active',
        startDate: formFields.startDate ? new Date(formFields.startDate) : new Date(),
        endDate: formFields.endDate ? new Date(formFields.endDate) : undefined,
        winnerSelectionMethod: formFields.winnerSelectionMethod || 'random',
        lotteryDetails: formFields.winnerSelectionMethod === 'lottery' ? {
          date: formFields.lotteryDate ? new Date(formFields.lotteryDate) : undefined,
          drawNumber: formFields.lotteryDrawNumber
        } : undefined,
        promotionEndDate: formFields.isPromoted === 'true' ? 
          new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) : // 30 días
          undefined
      });

      // Actualizar el contador de rifas gratuitas del usuario
      await User.findByIdAndUpdate(session.user.id, {
        $inc: { freeRafflesCount: -1 },
        $push: { createdRaffles: raffle._id }
      });

      return res.status(200).json({ 
        message: 'Rifa creada exitosamente',
        raffleId: raffle._id
      });
    }

    // Si no es gratuita, crear sesión de pago con Stripe
    try {
      console.log('Guardando imágenes de Cloudinary en usuario:', session.user.id);

      const updateResult = await User.findByIdAndUpdate(
        session.user.id,
        {
          $set: {
            cloudinaryTempImages: cloudinaryImages
          }
        },
        { new: true }
      );

      console.log('Resultado de la actualización:', updateResult ? 'Usuario actualizado' : 'Error en actualización');

      // Verificar que se guardaron correctamente
      const verifiedUser = await User.findById(session.user.id);
      
      // Verificar imágenes de Cloudinary
      const cloudinaryImagesTemporales = verifiedUser?.cloudinaryTempImages || [];
      const numCloudinaryImagenesGuardadas = Array.isArray(cloudinaryImagesTemporales) ? cloudinaryImagesTemporales.length : 0;
      
      console.log('Imágenes Cloudinary temporales guardadas:', numCloudinaryImagenesGuardadas);

      // Si no se guardaron imágenes, pero tampoco hubo error explícito en la actualización,
      // continuamos de todos modos con los datos en memoria
      if (numCloudinaryImagenesGuardadas === 0 && !updateResult) {
        console.warn('Advertencia: Las imágenes no se guardaron en la base de datos. Continuando con las imágenes en memoria.');
      }

      console.log('Continuando con', cloudinaryImages.length, 'imágenes en Cloudinary');

      // Para rifas pagadas, crea la sesión de Stripe con metadata mínima
      const stripeSession = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        line_items: [
          {
            price_data: {
              currency: 'mxn',
              product_data: {
                name: 'Creación de Rifa',
                description: formFields.isPromoted === 'true' ? 'Incluye promoción en página principal' : 'Rifa estándar',
              },
              unit_amount: totalCost * 100,
            },
            quantity: 1,
          },
        ],
        mode: 'payment',
        success_url: `${process.env.NEXTAUTH_URL}/raffles/create/success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${process.env.NEXTAUTH_URL}/raffles/create`,
        metadata: {
          userId: session.user.id,
          title: formFields.title,
          description: formFields.description,
          ticketPrice: formFields.price,
          totalTickets: formFields.totalTickets,
          socialLinks: JSON.stringify(parsedSocialLinks),
          isPromoted: formFields.isPromoted,
          // Almacenamos los datos relacionados con el método de selección en un solo campo JSON
          raffleConfig: JSON.stringify({
            startDate: formFields.startDate,
            endDate: formFields.endDate,
            winnerSelectionMethod: formFields.winnerSelectionMethod,
            lotteryDate: formFields.lotteryDate,
            lotteryDrawNumber: formFields.lotteryDrawNumber
          })
        },
      });

      res.status(200).json({
        url: stripeSession.url,
        sessionId: stripeSession.id,
      });
    } catch (error) {
      console.error('Error al guardar imágenes temporales:', error);
      throw error;
    }
  } catch (error) {
    console.error('Error general al crear rifa:', error);
    res.status(500).json({ message: 'Error al crear la rifa' });
  }
} 