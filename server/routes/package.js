import express from 'express';
import { auth } from '../middleware/auth.js';
import Package from '../models/Package.js';

const router = express.Router();

router.get('/track/:trackingId', auth, async (req, res) => {
  const pkg = await Package.findOne({ trackingId: req.params.trackingId });
  if(!pkg) return res.status(404).json({ message: 'Not found' });
  res.json({ pkg });
});

export default router;
