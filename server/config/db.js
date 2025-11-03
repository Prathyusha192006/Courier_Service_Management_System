import mongoose from 'mongoose';

export const connectDB = async () => {
  const uri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/trackbee';
  await mongoose.connect(uri, { dbName: process.env.MONGO_DB || 'trackbee' });
  console.log('MongoDB connected');
};
