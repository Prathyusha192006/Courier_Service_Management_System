import express from 'express';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { auth } from '../middleware/auth.js';

const router = express.Router();

const signToken = (user) => jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET || 'devsecret', { expiresIn: '7d' });

router.post('/register', async (req, res) => {
  try {
    const { firstName, lastName, email, phone, password, role, adminId, riderId } = req.body;
    if(role === 'admin' && !adminId) return res.status(400).json({ message: 'adminId required' });
    if(role === 'rider' && !riderId) return res.status(400).json({ message: 'riderId required' });
    const exists = await User.findOne({ email });
    if(exists) return res.status(400).json({ message: 'Email already registered' });
    const user = await User.create({ firstName, lastName, email, phone, password, role, adminId, riderId });
    const token = signToken(user);
    res.json({ token, user: { ...user.toObject(), password: undefined } });
  } catch (e) {
    res.status(500).json({ message: 'Registration failed' });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { email, password, role, adminId, riderId } = req.body;
    const user = await User.findOne({ email });
    if(!user || user.role !== role) return res.status(400).json({ message: 'Invalid credentials' });
    if(role === 'admin' && user.adminId && adminId && user.adminId !== adminId) return res.status(400).json({ message: 'Invalid admin ID' });
    if(role === 'rider' && user.riderId && riderId && user.riderId !== riderId) return res.status(400).json({ message: 'Invalid rider ID' });
    const ok = await user.comparePassword(password);
    if(!ok) return res.status(400).json({ message: 'Invalid credentials' });
    const token = signToken(user);
    res.json({ token, user: { ...user.toObject(), password: undefined } });
  } catch (e) {
    res.status(500).json({ message: 'Login failed' });
  }
});

router.get('/me', auth, async (req, res) => {
  res.json({ user: req.user });
});

export default router;
