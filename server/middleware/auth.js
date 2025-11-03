import jwt from 'jsonwebtoken';
import User from '../models/User.js';

export const auth = async (req, res, next) => {
  try {
    const header = req.headers.authorization || '';
    const token = header.startsWith('Bearer ') ? header.substring(7) : null;
    if(!token) return res.status(401).json({ message: 'Unauthorized' });
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'devsecret');
    const user = await User.findById(decoded.id).select('-password');
    if(!user) return res.status(401).json({ message: 'Unauthorized' });
    req.user = user;
    next();
  } catch (e) {
    return res.status(401).json({ message: 'Unauthorized' });
  }
};

export const requireRole = (...roles) => (req, res, next) => {
  if(!req.user || !roles.includes(req.user.role)){
    return res.status(403).json({ message: 'Access Denied' });
  }
  next();
};

export const authenticateSocket = async (socket, next) => {
  try {
    const token = socket.handshake.auth?.token;
    if(!token) return next(new Error('Unauthorized'));
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'devsecret');
    const user = await User.findById(decoded.id).select('-password');
    if(!user) return next(new Error('Unauthorized'));
    socket.user = user;
    next();
  } catch (e) {
    next(new Error('Unauthorized'));
  }
};
