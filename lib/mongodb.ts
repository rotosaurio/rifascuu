import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';

// Variable global para mantener la instancia de MongoMemoryServer
let mongoMemoryServer: MongoMemoryServer | null = null;

const connectDB = async () => {
  try {
    const opts = {
      bufferCommands: false,
      connectTimeoutMS: 30000, // 30 segundos de timeout
      socketTimeoutMS: 45000,  // 45 segundos de timeout para operaciones
      serverSelectionTimeoutMS: 30000, // 30 segundos para seleccionar servidor
      maxPoolSize: 10, // Máximo de 10 conexiones en el pool
      retryWrites: true
    };

    // Si ya hay una conexión activa, la devolvemos
    if (mongoose.connections[0].readyState) {
      return mongoose;
    }

    // Si estamos en desarrollo y no hay una URI definida, o la conexión a ella falla, usamos MongoDB Memory Server
    if (process.env.NODE_ENV !== 'production' && (!process.env.MONGODB_URI || process.env.USE_MEMORY_DB === 'true')) {
      console.log('Usando MongoDB Memory Server para desarrollo');
      
      if (!mongoMemoryServer) {
        mongoMemoryServer = await MongoMemoryServer.create();
      }
      
      const uri = mongoMemoryServer.getUri();
      await mongoose.connect(uri, opts);
      console.log('Conexión a MongoDB Memory Server establecida correctamente');
      return mongoose;
    }

    // En producción o si hay una URI definida, usamos esa
    if (!process.env.MONGODB_URI) {
      throw new Error('Por favor define la variable de entorno MONGODB_URI');
    }

    const MONGODB_URI = process.env.MONGODB_URI;
    await mongoose.connect(MONGODB_URI, opts);
    console.log('Conexión a MongoDB establecida correctamente');
    return mongoose;
  } catch (error) {
    console.error('Error al conectar a MongoDB:', error);
    
    // Si estamos en desarrollo y la conexión a MongoDB Atlas falla, intentamos con MongoDB Memory Server
    if (process.env.NODE_ENV !== 'production' && !mongoMemoryServer) {
      console.log('Intentando con MongoDB Memory Server después de fallo...');
      
      try {
        mongoMemoryServer = await MongoMemoryServer.create();
        const uri = mongoMemoryServer.getUri();
        
        const opts = {
          bufferCommands: false,
          connectTimeoutMS: 30000,
          socketTimeoutMS: 45000,
          serverSelectionTimeoutMS: 30000,
          maxPoolSize: 10,
          retryWrites: true
        };
        
        await mongoose.connect(uri, opts);
        console.log('Conexión a MongoDB Memory Server establecida correctamente (fallback)');
        return mongoose;
      } catch (memoryServerError) {
        console.error('Error al conectar a MongoDB Memory Server:', memoryServerError);
        throw memoryServerError;
      }
    }
    
    throw error;
  }
};

export default connectDB; 