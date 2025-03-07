import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';

// Global variable for MongoMemoryServer instance (only used in development)
let mongoMemoryServer: MongoMemoryServer | null = null;

const connectDB = async () => {
  try {
    // If already connected, return the existing connection
    if (mongoose.connections[0].readyState) {
      console.log('Using existing MongoDB connection');
      return mongoose;
    }
    
    const opts = {
      bufferCommands: false,
      connectTimeoutMS: 30000,
      socketTimeoutMS: 45000,
      serverSelectionTimeoutMS: 30000,
      maxPoolSize: 10,
      dbName: 'rifas', // Explicitly set database name to "rifas"
    };

    // Parse USE_MEMORY_DB explicitly to boolean
    // Convert 'true' string to boolean true, anything else is false
    const useMemoryDB = process.env.USE_MEMORY_DB === 'true';
    
    console.log(`MONGODB_URI exists: ${Boolean(process.env.MONGODB_URI)}`);
    console.log(`USE_MEMORY_DB value: ${process.env.USE_MEMORY_DB}`);
    console.log(`Should use memory server: ${useMemoryDB}`);

    // Check if we should use memory server
    if (useMemoryDB) {
      console.log('Explicitly using MongoDB Memory Server for development');
      
      if (!mongoMemoryServer) {
        mongoMemoryServer = await MongoMemoryServer.create({
          instance: {
            dbName: 'rifas' // Ensure memory server also uses "rifas" database
          }
        });
      }
      
      const uri = mongoMemoryServer.getUri();
      console.log(`Memory server URI: ${uri}`);
      await mongoose.connect(uri, opts);
      console.log('Successfully connected to MongoDB Memory Server database: rifas');
      return mongoose;
    }

    // If we're here, we're supposed to use a real MongoDB connection
    if (!process.env.MONGODB_URI) {
      throw new Error('MONGODB_URI environment variable is required when USE_MEMORY_DB is not true');
    }

    // Connect to the real MongoDB database
    console.log('Connecting to MongoDB Atlas...');
    await mongoose.connect(process.env.MONGODB_URI, opts);
    console.log('Successfully connected to MongoDB Atlas database: rifas');
    
    return mongoose;
  } catch (error) {
    console.error('Failed to connect to MongoDB:', error);
    throw error;
  }
};

// Add this function to properly close connections, especially useful for tests
export const disconnectDB = async () => {
  try {
    await mongoose.disconnect();
    
    if (mongoMemoryServer) {
      await mongoMemoryServer.stop();
      mongoMemoryServer = null;
    }
    
    console.log('Disconnected from MongoDB');
  } catch (error) {
    console.error('Failed to disconnect from MongoDB:', error);
    throw error;
  }
};

export default connectDB;