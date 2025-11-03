import express from 'express';
import { auth, requireRole } from '../middleware/auth.js';
import Package from '../models/Package.js';
import { suggestPrice } from '../utils/pricing.js';
import { v4 as uuidv4 } from 'uuid';

const router = express.Router();

router.use(auth, requireRole('customer'));

router.post('/shipments', async (req, res) => {
  const { sender, receiver, type, extraPaid = 0 } = req.body;
  // Basic validation
  const isValidGeo = (g) => g && typeof g.lat === 'number' && !isNaN(g.lat) && typeof g.lng === 'number' && !isNaN(g.lng);
  const missing = [];
  if(!sender?.name) missing.push('sender.name');
  if(!sender?.address) missing.push('sender.address');
  if(!sender?.phone) missing.push('sender.phone');
  if(!isValidGeo(sender?.geo)) missing.push('sender.geo');
  if(!receiver?.name) missing.push('receiver.name');
  if(!receiver?.address) missing.push('receiver.address');
  if(!receiver?.phone) missing.push('receiver.phone');
  if(!isValidGeo(receiver?.geo)) missing.push('receiver.geo');
  if(type && !['standard','express'].includes(type)) return res.status(400).json({ message: 'Invalid type' });
  const extra = Number(extraPaid || 0);
  if(missing.length > 0) return res.status(400).json({ message: 'Missing or invalid fields', fields: missing });
  if(extra < 0) return res.status(400).json({ message: 'extraPaid cannot be negative' });
  const trackingId = `TB-${uuidv4().slice(0,8).toUpperCase()}`;
  const price = suggestPrice(sender.geo, receiver.geo, type || 'standard') + extra;
  const pkg = await Package.create({
    trackingId,
    customer: req.user._id,
    sender,
    receiver,
    type: type || 'standard',
    price,
    extraPaid: extra,
    status: extra > 0 || type === 'express' ? 'Assigned' : 'Created',
    history: [{ status: 'Created' }]
  });
  res.json({ pkg });
});

router.get('/shipments', async (req, res) => {
  const list = await Package.find({ customer: req.user._id });
  res.json({ shipments: list });
});

router.get('/track/:trackingId', async (req, res) => {
  const pkg = await Package.findOne({ trackingId: req.params.trackingId, customer: req.user._id });
  if(!pkg) return res.status(404).json({ message: 'Not found' });
  res.json({ pkg });
});

export default router;
