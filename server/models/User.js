import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const UserSchema = new mongoose.Schema({
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  phone: { type: String },
  password: { type: String, required: true },
  role: { type: String, enum: ['admin', 'rider', 'customer'], required: true },
  adminId: { type: String },
  riderId: { type: String },
  leaves: { type: Number, default: 0 },
  salaryBase: { type: Number, default: 0 },
  earnings: { type: Number, default: 0 },
  rating: { type: Number, default: 5 },
  attendance: [{
    date: { type: Date, default: () => new Date(new Date().toDateString()) },
    checkIn: { type: Date },
    checkOut: { type: Date },
    hours: { type: Number, default: 0 }
  }],
}, { timestamps: true });

UserSchema.pre('save', async function(next){
  if(!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

UserSchema.methods.comparePassword = function(candidate){
  return bcrypt.compare(candidate, this.password);
}

export default mongoose.model('User', UserSchema);
