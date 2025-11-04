import express from 'express';
import http from 'http';
import { Server as SocketIOServer } from 'socket.io';
import mongoose from 'mongoose';
import morgan from 'morgan';
import cors from 'cors';
import dotenv from 'dotenv';
import cookieParser from 'cookie-parser';
import authRoutes from './routes/auth.js';
import adminRoutes from './routes/admin.js';
import riderRoutes from './routes/rider.js';
import customerRoutes from './routes/customer.js';
import packageRoutes from './routes/package.js';
import { authenticateSocket } from './middleware/auth.js';
import { connectDB } from './config/db.js';
import Package from './models/Package.js';

dotenv.config();

const app = express();
const server = http.createServer(app);
const allowedOrigins = [
  process.env.CLIENT_URL || 'http://localhost:5173',
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  'https://courier-service-management-system-k.vercel.app'
];
const corsOptions = {
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) return callback(null, true);
    return callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  optionsSuccessStatus: 204
};

const io = new SocketIOServer(server, {
  cors: { origin: allowedOrigins, credentials: true, methods: ['GET','POST'], allowedHeaders: ['Content-Type','Authorization'] }
});

// Socket auth and rooms by user id and role
io.use(authenticateSocket);
io.on('connection', (socket) => {
  const user = socket.user;
  socket.join(`user:${user._id}`);
  socket.join(`role:${user.role}`);
  socket.on('rider:location', async (payload = {}) => {
    try {
      if (socket.user?.role !== 'rider') return;
      const { lat, lng, accuracy, heading, speed } = payload || {};
      if (typeof lat !== 'number' || typeof lng !== 'number') return;
      const active = await Package.find({ rider: socket.user._id, status: { $ne: 'Delivered' } }).select('_id trackingId customer');
      const data = { trackingIds: active.map(p => p.trackingId), lat, lng, accuracy, heading, speed, at: Date.now() };
      active.forEach(p => {
        io.to(`user:${p.customer}`).emit('package:location', { trackingId: p.trackingId, lat, lng, accuracy, heading, speed, at: data.at });
      });
      io.to(`user:${socket.user._id}`).emit('rider:location:ack', data);
    } catch (_) {}
  });
  socket.on('disconnect', () => {});
});

app.set('io', io);

app.use(cors(corsOptions));
// Ensure preflight requests succeed for all routes
app.options('*', cors(corsOptions));
app.use(express.json());
app.use(cookieParser());
app.use(morgan('dev'));

app.get('/', (req, res) => res.json({ name: 'Track Bee API', status: 'OK' }));

app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/rider', riderRoutes);
app.use('/api/customer', customerRoutes);
app.use('/api/packages', packageRoutes);

const PORT = process.env.PORT || 4000;
connectDB().then(() => {
  server.listen(PORT, () => console.log(`API running on http://localhost:${PORT}`));
});
