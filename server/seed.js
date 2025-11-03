import dotenv from 'dotenv';
import { connectDB } from './config/db.js';
import User from './models/User.js';

dotenv.config();

const run = async () => {
  await connectDB();
  await User.deleteMany({});
  const users = await User.insertMany([
    { firstName: 'Kitty', lastName: 'Admin', email: 'kitty1911@gmail.com', phone: '9999999999', password: 'kitty1911', role: 'admin', adminId: 'ADMIN001' },
    { firstName: 'Ammu', lastName: 'Customer', email: 'bharath@gmail.com', phone: '8888888888', password: 'ammu1119', role: 'customer' },
    { firstName: 'Sravanthi', lastName: 'Rider', email: 'sravi@gmail.com', phone: '7777777777', password: 'sravanthi', role: 'rider', riderId: 'RIDER001' }
  ]);
  console.log('Seeded users:', users.map(u => u.email));
  process.exit(0);
};

run();
