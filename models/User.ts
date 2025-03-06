import mongoose from 'mongoose';

// Este tipo está obsoleto - se mantiene solo para compatibilidad
interface TempImage {
  data: string;
  contentType: string;
}

// Este es el tipo principal a usar de ahora en adelante
interface CloudinaryTempImage {
  url: string;
  publicId: string;
}

const UserSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
  },
  name: {
    type: String,
    required: true,
  },
  password: {
    type: String,
    required: true,
  },
  role: {
    type: String,
    enum: ['user', 'admin'],
    default: 'user',
  },
  freeRafflesCount: {
    type: Number,
    default: 0,
  },
  promoCode: {
    type: String,
    unique: true,
    sparse: true,
  },
  promoCodeUsed: {
    type: Boolean,
    default: false,
  },
  // Campos obsoletos - se mantienen para compatibilidad con usuarios existentes
  tempRaffleImages: [{
    data: String,
    contentType: String
  }],
  raffleImageTemp: {
    type: [String],
    default: [],
  },
  // Único campo de imágenes temporales que debe utilizarse de ahora en adelante
  cloudinaryTempImages: [{
    url: String,
    publicId: String
  }],
  createdRaffles: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Raffle',
  }],
  participatingRaffles: [{
    raffle: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Raffle',
    },
    tickets: [Number],
  }],
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

export default mongoose.models.User || mongoose.model('User', UserSchema); 