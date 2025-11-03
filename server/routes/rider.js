import express from 'express';
import multer from 'multer';
import { auth, requireRole } from '../middleware/auth.js';
import Package from '../models/Package.js';

const router = express.Router();
const upload = multer({ dest: 'uploads/' });

router.use(auth, requireRole('rider'));

router.get('/assigned', async (req, res) => {
  const list = await Package.find({ rider: req.user._id, status: { $ne: 'Delivered' } });
  const total = await Package.countDocuments({ rider: req.user._id });
  const delivered = await Package.countDocuments({ rider: req.user._id, status: 'Delivered' });
  const earnings = Math.round((await Package.aggregate([
    { $match: { rider: req.user._id } },
    { $group: { _id: null, sum: { $sum: '$price' } } }
  ]))[0]?.sum * 0.7 || 0);
  res.json({ deliveries: list, summary: { total, delivered, earnings } });
});

// Attendance: check-in
router.post('/attendance/checkin', async (req, res) => {
  const u = req.user;
  const today = new Date(new Date().toDateString());
  const last = u.attendance?.find(a => new Date(a.date).toDateString() === today.toDateString());
  if(last && last.checkIn) return res.json({ message: 'Already checked in' });
  u.attendance.push({ date: today, checkIn: new Date() });
  await u.save();
  res.json({ message: 'Checked in' });
});

// Attendance: check-out
router.post('/attendance/checkout', async (req, res) => {
  const u = req.user;
  const today = new Date(new Date().toDateString());
  const entry = u.attendance?.find(a => new Date(a.date).toDateString() === today.toDateString());
  if(!entry || !entry.checkIn) return res.status(400).json({ message: 'Check-in first' });
  if(entry.checkOut) return res.json({ message: 'Already checked out' });
  entry.checkOut = new Date();
  entry.hours = Math.max(0, (entry.checkOut - new Date(entry.checkIn)) / 36e5);
  await u.save();
  res.json({ message: 'Checked out', hours: entry.hours });
});

router.post('/status', async (req, res) => {
  const { trackingId, status } = req.body;
  const pkg = await Package.findOne({ trackingId, rider: req.user._id });
  if(!pkg) return res.status(404).json({ message: 'Package not found' });
  pkg.status = status;
  pkg.history.push({ status });
  await pkg.save();
  const io = req.app.get('io');
  io.to(`user:${pkg.customer}`).emit('package:update', { trackingId: pkg.trackingId, status });
  res.json({ pkg });
});

router.post('/deliver', upload.single('proof'), async (req, res) => {
  const { trackingId } = req.body;
  const pkg = await Package.findOne({ trackingId, rider: req.user._id });
  if(!pkg) return res.status(404).json({ message: 'Package not found' });
  pkg.status = 'Delivered';
  pkg.history.push({ status: 'Delivered' });
  pkg.proof = { photoUrl: req.file?.path };
  await pkg.save();
  const io = req.app.get('io');
  io.to(`user:${pkg.customer}`).emit('package:update', { trackingId: pkg.trackingId, status: 'Delivered' });
  res.json({ pkg });
});

export default router;
