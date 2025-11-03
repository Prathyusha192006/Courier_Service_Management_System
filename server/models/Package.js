import mongoose from 'mongoose';

const PackageSchema = new mongoose.Schema({
  trackingId: { type: String, unique: true, required: true },
  customer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  rider: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  sender: {
    name: String,
    address: String,
    phone: String,
    geo: { lat: Number, lng: Number }
  },
  receiver: {
    name: String,
    address: String,
    phone: String,
    geo: { lat: Number, lng: Number }
  },
  type: { type: String, enum: ['standard', 'express'], default: 'standard' },
  price: { type: Number, default: 0 },
  extraPaid: { type: Number, default: 0 },
  status: { type: String, enum: ['Created', 'Assigned', 'In Transit', 'Delivered'], default: 'Created' },
  history: [{ status: String, at: { type: Date, default: Date.now } }],
  proof: {
    photoUrl: String,
    signature: String
  }
}, { timestamps: true });

export default mongoose.model('Package', PackageSchema);
