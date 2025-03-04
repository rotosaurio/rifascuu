import mongoose from 'mongoose';

const RaffleSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  totalTickets: {
    type: Number,
    required: true,
  },
  ticketPrice: {
    type: Number,
    required: true,
  },
  images: [{
    type: String,
  }],
  contactInfo: {
    type: String,
    required: true,
  },
  creator: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  isPromoted: {
    type: Boolean,
    default: false,
  },
  promotionEndDate: {
    type: Date,
  },
  soldTickets: [{
    number: Number,
    buyer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    purchaseDate: {
      type: Date,
      default: Date.now,
    }
  }],
  status: {
    type: String,
    enum: ['active', 'completed', 'cancelled'],
    default: 'active',
  },
  winner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

export default mongoose.models.Raffle || mongoose.model('Raffle', RaffleSchema); 