const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');

const HydrationTest = require('../models/HydrationTest');

router.get('/history', authenticateToken, async (req, res) => {
  try {
    const tests = await HydrationTest.find({ userId: req.user.id })
      .sort({ createdAt: -1 })
      .limit(50);

    res.json({ success: true, history: tests });
  } catch (error) {
    console.error('Error fetching history:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch history'
    });
  }
});

router.get('/status', (req, res) => {
  res.json({ success: true, message: 'Hydration service OK' });
});

module.exports = router;
