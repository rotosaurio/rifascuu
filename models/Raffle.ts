import mongoose, { Schema, model, models, Types } from 'mongoose';

interface SoldTicket {
  number: number;
  buyer: Types.ObjectId;
  purchaseDate: Date;
}

// Este tipo será obsoleto - se mantiene para compatibilidad
interface Image {
  data: string;
  contentType: string;
}

// Este es el tipo principal a usar de ahora en adelante
interface CloudinaryImage {
  url: string;
  publicId: string;
}

const SoldTicketSchema = new Schema({
  number: {
    type: Number,
    required: true
  },
  buyer: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  purchaseDate: {
    type: Date,
    default: Date.now
  },
  transactionId: String
});

const raffleSchema = new Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  ticketPrice: { type: Number, required: true },
  totalTickets: { type: Number, required: true },
  startDate: { 
    type: Date, 
    default: Date.now 
  },
  endDate: { 
    type: Date
  },
  winnerSelectionMethod: {
    type: String,
    enum: ['random', 'lottery', 'manual'],
    default: 'random'
  },
  lotteryDetails: {
    date: { type: Date },
    drawNumber: { type: String }
  },
  // Campo obsoleto - se mantiene para compatibilidad con rifas existentes
  images: [{
    data: { type: String },
    contentType: { type: String }
  }],
  // Único campo de imágenes que debe utilizarse de ahora en adelante
  cloudinaryImages: [{
    url: { type: String, required: true },
    publicId: { type: String, required: true }
  }],
  socialLinks: {
    whatsapp: { type: String },
    facebook: { type: String },
    instagram: { type: String },
    twitter: { type: String }
  },
  creator: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  soldTickets: [SoldTicketSchema],
  status: {
    type: String,
    enum: ['active', 'completed', 'deleted'],
    default: 'active'
  },
  isPromoted: {
    type: Boolean,
    default: false
  },
  promotionEndDate: {
    type: Date
  },
  winner: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  },
  winningTicket: { 
    type: Number 
  },
  createdAt: { 
    type: Date, 
    default: Date.now 
  }
});

export default models.Raffle || model('Raffle', raffleSchema);