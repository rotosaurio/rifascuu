import mongoose from 'mongoose';

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
  freeRafflesCount: {
    type: Number,
    default: 0,
  },
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