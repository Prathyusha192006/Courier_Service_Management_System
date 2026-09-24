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

/* =========================================================
   CORS CONFIGURATION
   ========================================================= */

const exactOrigins = [
  'http://localhost:5173',
  'http://127.0.0.1:5173',

  // Vercel production frontend
  'https://courier-service-management-system-k.vercel.app',

  // Current Vercel preview/project deployment
  'https://courier-service-management-git-3f4d87-prathyusha192006s-projects.vercel.app'
];

const originPatterns = [
  // Allow Vercel preview deployments
  /^https:\/\/[a-z0-9-]+\.vercel\.app$/i,

  // Allow Vercel project preview URLs
  /^https:\/\/[a-z0-9-]+-prathyusha192006s-projects\.vercel\.app$/i
];

const isAllowedOrigin = (origin) => {
  // Requests such as server-to-server requests may not contain Origin
  if (!origin) {
    return true;
  }

  // Allow exact origins
  if (exactOrigins.includes(origin)) {
    return true;
  }

  // Allow valid Vercel preview URLs
  return originPatterns.some((pattern) => pattern.test(origin));
};

const corsOptions = {
  origin: (origin, callback) => {
    if (isAllowedOrigin(origin)) {
      callback(null, true);
    } else {
      console.log(`CORS blocked origin: ${origin}`);
      callback(new Error(`CORS blocked origin: ${origin}`));
    }
  },

  credentials: true,

  methods: [
    'GET',
    'POST',
    'PUT',
    'PATCH',
    'DELETE',
    'OPTIONS'
  ],

  allowedHeaders: [
    'Content-Type',
    'Authorization'
  ],

  optionsSuccessStatus: 204
};

/* =========================================================
   SOCKET.IO
   ========================================================= */

const io = new SocketIOServer(server, {
  cors: {
    origin: (origin, callback) => {
      if (isAllowedOrigin(origin)) {
        callback(null, true);
      } else {
        console.log(`Socket CORS blocked origin: ${origin}`);
        callback(new Error(`Socket CORS blocked origin: ${origin}`));
      }
    },

    credentials: true,

    methods: ['GET', 'POST'],

    allowedHeaders: [
      'Content-Type',
      'Authorization'
    ]
  }
});

/* =========================================================
   SOCKET AUTHENTICATION
   ========================================================= */

io.use(authenticateSocket);

io.on('connection', (socket) => {
  const user = socket.user;

  // Join user-specific room
  socket.join(`user:${user._id}`);

  // Join role-specific room
  socket.join(`role:${user.role}`);

  /* -------------------------------------------------------
     Rider live location
     ------------------------------------------------------- */

  socket.on('rider:location', async (payload = {}) => {
    try {
      // Only riders can send location
      if (socket.user?.role !== 'rider') {
        return;
      }

      const {
        lat,
        lng,
        accuracy,
        heading,
        speed
      } = payload || {};

      // Validate coordinates
      if (
        typeof lat !== 'number' ||
        typeof lng !== 'number'
      ) {
        return;
      }

      // Find active packages assigned to this rider
      const active = await Package.find({
        rider: socket.user._id,
        status: { $ne: 'Delivered' }
      }).select('_id trackingId customer');

      const data = {
        trackingIds: active.map(
          (p) => p.trackingId
        ),
        lat,
        lng,
        accuracy,
        heading,
        speed,
        at: Date.now()
      };

      // Send rider location to customers
      active.forEach((p) => {
        io
          .to(`user:${p.customer}`)
          .emit('package:location', {
            trackingId: p.trackingId,
            lat,
            lng,
            accuracy,
            heading,
            speed,
            at: data.at
          });
      });

      // Send acknowledgement back to rider
      io
        .to(`user:${socket.user._id}`)
        .emit('rider:location:ack', data);

    } catch (error) {
      console.error(
        'Rider location error:',
        error.message
      );
    }
  });

  /* -------------------------------------------------------
     Socket disconnect
     ------------------------------------------------------- */

  socket.on('disconnect', () => {
    console.log(
      `Socket disconnected: ${socket.id}`
    );
  });
});

/* =========================================================
   EXPRESS MIDDLEWARE
   ========================================================= */

// CORS
app.use(cors(corsOptions));

// JSON body parser
app.use(express.json());

// Cookie parser
app.use(cookieParser());

// HTTP request logger
app.use(morgan('dev'));

/* =========================================================
   BASIC ROUTES
   ========================================================= */

// Root API
app.get('/', (req, res) => {
  res.json({
    name: 'Track Bee API',
    status: 'OK'
  });
});

// Health check
app.get('/api/health', (req, res) => {
  const state = mongoose.connection.readyState;

  const map = {
    0: 'disconnected',
    1: 'connected',
    2: 'connecting',
    3: 'disconnecting'
  };

  const dbName =
    mongoose.connection?.connections?.[0]?.name ||
    mongoose.connection?.name ||
    process.env.MONGO_DB ||
    'trackbee';

  res.json({
    api: 'ok',
    db: map[state] || String(state),
    dbName
  });
});

/* =========================================================
   API ROUTES
   ========================================================= */

app.use('/api/auth', authRoutes);

app.use('/api/admin', adminRoutes);

app.use('/api/rider', riderRoutes);

app.use('/api/customer', customerRoutes);

app.use('/api/packages', packageRoutes);

/* =========================================================
   ERROR HANDLER
   ========================================================= */

app.use((err, req, res, next) => {
  console.error('Server Error:', err.message);

  // CORS error
  if (err.message?.startsWith('CORS blocked origin')) {
    return res.status(403).json({
      message: 'CORS policy blocked this origin',
      origin: req.headers.origin || null
    });
  }

  res.status(500).json({
    message: 'Internal Server Error'
  });
});

/* =========================================================
   START SERVER
   ========================================================= */

const PORT = process.env.PORT || 4000;

connectDB()
  .then(() => {
    server.listen(PORT, () => {
      console.log(
        `API running on port ${PORT}`
      );
    });
  })
  .catch((error) => {
    console.error(
      'Failed to start server:',
      error.message
    );
    process.exit(1);
  });
