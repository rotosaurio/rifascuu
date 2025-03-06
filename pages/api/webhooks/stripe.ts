import { buffer } from 'micro';
import type { NextApiRequest, NextApiResponse } from 'next';
import Stripe from 'stripe';
import connectDB from '../../../lib/mongodb';
import Raffle from '../../../models/Raffle';
import User from '../../../models/User';
import { Types } from 'mongoose';

interface TempImage {
  data: string;
  contentType: string;
}

interface CloudinaryImage {
  url: string;
  publicId: string;
}

interface UserDocument {
  _id: Types.ObjectId;
  raffleImageTemp?: string[];
  tempRaffleImages?: Array<TempImage>;
  cloudinaryTempImages?: Array<CloudinaryImage>;
  createdRaffles: Types.ObjectId[];
}

interface RaffleConfig {
  startDate?: string;
  endDate?: string;
  winnerSelectionMethod?: string;
  lotteryDate?: string;
  lotteryDrawNumber?: string;
}

// Imagen Cloudinary por defecto
const DEFAULT_CLOUDINARY_IMAGE: CloudinaryImage = {
  url: 'https://res.cloudinary.com/demo/image/upload/v1312461204/sample.jpg',
  publicId: 'sample'
};

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2022-11-15',
});

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Método no permitido' });
  }

  let event: Stripe.Event;
  
  try {
    const buf = await buffer(req);
    const sig = req.headers['stripe-signature'];

    if (!sig) {
      return res.status(400).json({ message: 'Falta la firma de Stripe' });
    }

    try {
      event = stripe.webhooks.constructEvent(buf, sig, webhookSecret);
    } catch (err) {
      console.error('Error al verificar firma del webhook:', err);
      return res.status(400).json({ message: 'Error de verificación del webhook' });
    }

    console.log('Evento de Stripe recibido:', event.type);

    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as Stripe.Checkout.Session;
      
      // Verificar que existe metadata
      if (!session.metadata) {
        console.error('La sesión no contiene metadata');
        return res.status(400).json({ message: 'La sesión no contiene metadata necesaria' });
      }
      
      const metadata = session.metadata;

      console.log('Metadata recibida:', metadata);

      try {
        await connectDB();

        // Buscar el usuario
        let user = await User.findById(metadata.userId);
        
        // Si no encontramos el usuario, lo manejamos
        if (!user) {
          console.warn('Usuario no encontrado:', metadata.userId);
          console.warn('Continuando sin usuario. Generando imagen por defecto.');
          
          // Usar imágenes por defecto si no hay usuario
          const raffle = await Raffle.create({
            title: metadata.title,
            description: metadata.description,
            ticketPrice: parseFloat(metadata.ticketPrice),
            totalTickets: parseInt(metadata.totalTickets),
            socialLinks: JSON.parse(metadata.socialLinks),
            creator: metadata.userId,
            images: [{
              data: 'R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7', // GIF transparente en base64
              contentType: 'image/gif'
            }],
            // Agregar una imagen por defecto para Cloudinary
            cloudinaryImages: [DEFAULT_CLOUDINARY_IMAGE],
            isPromoted: metadata.isPromoted === 'true',
            status: 'active',
            startDate: new Date(),
            promotionEndDate: metadata.isPromoted === 'true' ? 
              new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) : // 30 días
              undefined
          });
          
          console.log('Rifa creada exitosamente sin usuario:', raffle._id);
          return res.status(200).json({ received: true });
        }

        // Buscar las imágenes temporales del usuario
        const userData = await User.findById(metadata.userId).lean() as unknown as UserDocument;
        
        // Obtener imágenes de Cloudinary (principal)
        let cloudinaryImages: CloudinaryImage[] = [];

        // Verificar que userData existe y tiene la propiedad cloudinaryTempImages
        if (userData && userData.cloudinaryTempImages) {
          const tempImages = userData.cloudinaryTempImages;
          if (Array.isArray(tempImages) && tempImages.length > 0) {
            cloudinaryImages = tempImages.filter((img): img is CloudinaryImage => 
              img && 
              typeof img === 'object' && 
              'url' in img && 
              'publicId' in img && 
              typeof img.url === 'string' && 
              typeof img.publicId === 'string'
            );
          }
        }

        // Si no hay imágenes de Cloudinary, buscar en el método antiguo
        if (cloudinaryImages.length === 0) {
          console.log('No se encontraron imágenes de Cloudinary válidas. Verificando imágenes antiguas...');
          
          // Intentar con imágenes antiguas (obsoleto)
          let images: TempImage[] = [];
          
          try {
            // Verificar tempRaffleImages
            if (userData && userData.tempRaffleImages) {
              const tempImages = userData.tempRaffleImages;
              if (Array.isArray(tempImages) && tempImages.length > 0) {
                console.log('Usando imágenes temporales del formato antiguo');
                // Validar estructura de cada imagen
                images = tempImages.filter(img => 
                  img && 
                  typeof img === 'object' && 
                  'data' in img && 
                  'contentType' in img
                );
              }
            }
            // Verificar raffleImageTemp 
            else if (userData && userData.raffleImageTemp) {
              const tempImages = userData.raffleImageTemp;
              if (Array.isArray(tempImages) && tempImages.length > 0) {
                console.log('Convirtiendo strings base64 a objetos de imagen');
                images = tempImages
                  .filter((dataStr: string) => typeof dataStr === 'string' && dataStr.trim() !== '')
                  .map((dataStr: string) => ({
                    data: dataStr,
                    contentType: 'image/jpeg'
                  }));
              }
            }
            
            // Si se encontraron imágenes antiguas pero no se pueden usar con Cloudinary
            if (images.length > 0) {
              console.log(`Se encontraron ${images.length} imágenes en formato antiguo, pero no son compatibles con Cloudinary`);
              // Aquí se podrían convertir las imágenes antiguas a formato Cloudinary si fuera necesario
            }
          } catch (error) {
            console.error('Error al procesar imágenes antiguas:', error);
          }
          
          // Si no se encontraron imágenes usables, usar la imagen por defecto
          if (cloudinaryImages.length === 0) {
            console.log('Usando imagen por defecto de Cloudinary');
            cloudinaryImages = [DEFAULT_CLOUDINARY_IMAGE];
          }
        }

        console.log(`Procesando ${cloudinaryImages.length} imágenes de Cloudinary`);

        // Verificar si tenemos imágenes válidas de Cloudinary
        const validCloudinaryImages = cloudinaryImages.filter((img) => 
          img && img.url && img.publicId
        );

        if (validCloudinaryImages.length === 0) {
          console.error('No se encontraron imágenes de Cloudinary válidas. Usando imagen por defecto.');
          // Imagen Cloudinary por defecto
          cloudinaryImages = [DEFAULT_CLOUDINARY_IMAGE];
        } else {
          cloudinaryImages = validCloudinaryImages;
        }

        console.log('Procesadas correctamente', cloudinaryImages.length, 'imágenes de Cloudinary');
        
        // Procesar la configuración de la rifa si existe
        let raffleConfig: RaffleConfig = {};
        if (metadata.raffleConfig) {
          try {
            raffleConfig = JSON.parse(metadata.raffleConfig as string) as RaffleConfig;
            console.log('Configuración de la rifa procesada:', raffleConfig);
          } catch (error) {
            console.error('Error al procesar la configuración de la rifa:', error);
          }
        }
        
        // Crear la rifa con los datos de la sesión y las imágenes de Cloudinary
        const raffle = await Raffle.create({
          title: metadata.title,
          description: metadata.description,
          ticketPrice: parseFloat(metadata.ticketPrice as string),
          totalTickets: parseInt(metadata.totalTickets as string),
          socialLinks: JSON.parse(metadata.socialLinks as string),
          creator: metadata.userId,
          cloudinaryImages,
          isPromoted: metadata.isPromoted === 'true',
          status: 'active',
          startDate: raffleConfig.startDate ? new Date(raffleConfig.startDate) : new Date(),
          endDate: raffleConfig.endDate ? new Date(raffleConfig.endDate) : undefined,
          winnerSelectionMethod: raffleConfig.winnerSelectionMethod || 'random',
          lotteryDetails: raffleConfig.winnerSelectionMethod === 'lottery' ? {
            date: raffleConfig.lotteryDate ? new Date(raffleConfig.lotteryDate) : undefined,
            drawNumber: raffleConfig.lotteryDrawNumber
          } : undefined,
          promotionEndDate: metadata.isPromoted === 'true' ? 
            new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) : // 30 días
            undefined
        });

        // Actualizar el usuario y limpiar las imágenes temporales
        await User.findByIdAndUpdate(metadata.userId, {
          $push: { createdRaffles: raffle._id },
          $set: { 
            raffleImageTemp: [],
            tempRaffleImages: [],
            cloudinaryTempImages: []
          }
        });
        
        console.log('Rifa creada exitosamente:', raffle._id);
        
      } catch (error) {
        console.error('Error detallado en el procesamiento del webhook:', error);
        return res.status(500).json({ message: 'Error al procesar el webhook' });
      }
    }

    return res.status(200).json({ received: true });
  } catch (error) {
    console.error('Error al procesar webhook:', error);
    return res.status(500).json({ message: 'Error al procesar webhook' });
  }
}