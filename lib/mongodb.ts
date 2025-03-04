import mongoose from 'mongoose';

if (!process.env.MONGODB_URI) {
  throw new Error('Por favor define la variable de entorno MONGODB_URI');
}

const MONGODB_URI = process.env.MONGODB_URI;

const connectDB = async () => {
  try {
    const opts = {
      bufferCommands: false,
    };

    if (mongoose.connections[0].readyState) {
      return mongoose;
    }

    await mongoose.connect(MONGODB_URI, opts);
    return mongoose;
  } catch (error) {
    throw error;
  }
};

export default connectDB; 