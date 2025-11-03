import express from 'express';
import { auth, requireRole } from '../middleware/auth.js';
import User from '../models/User.js';
import Package from '../models/Package.js';

const router = express.Router();

router.use(auth, requireRole('admin'));

router.get('/stats', async (req, res) => {
  const [packages, riders, customers, staff] = await Promise.all([
    Package.countDocuments(),
    User.countDocuments({ role: 'rider' }),
    User.countDocuments({ role: 'customer' }),
    0
  ]);
  const revenueAgg = await Package.aggregate([{ $group: { _id: null, revenue: { $sum: '$price' } } }]);
  const revenue = revenueAgg[0]?.revenue || 0;
  res.json({ totals: { packages, riders, customers, staff, revenue } });
});

router.get('/riders', async (req, res) => {
  const riders = await User.find({ role: 'rider' }).select('-password');
  res.json({ riders });
});

router.get('/packages', async (req, res) => {
  const list = await Package.find().populate('customer', 'firstName lastName').populate('rider', 'firstName lastName');
  res.json({ packages: list });
});

router.post('/assign', async (req, res) => {
  const { trackingId, riderId } = req.body;
  const pkg = await Package.findOne({ trackingId });
  if(!pkg) return res.status(404).json({ message: 'Package not found' });
  const rider = await User.findById(riderId);
  if(!rider || rider.role !== 'rider') return res.status(400).json({ message: 'Invalid rider' });
  pkg.rider = rider._id;
  pkg.status = 'Assigned';
  pkg.history.push({ status: 'Assigned' });
  await pkg.save();
  const io = req.app.get('io');
  io.to(`user:${rider._id}`).emit('assignment', { trackingId: pkg.trackingId });
  res.json({ message: 'Assigned', pkg });
});

export default router;
