const express = require('express');
const pool = require('../db');
const { adminAuth } = require('../middleware/auth');

const router = express.Router();

// POST /api/analytics/event - track checkout conversion milestones
router.post('/event', async (req, res, next) => {
  try {
    const { eventType, amount = 0 } = req.body;
    
    // Validate event type
    const validEvents = [
      'checkout_start_guest', 
      'checkout_start_registered', 
      'checkout_complete_guest', 
      'checkout_complete_registered'
    ];
    if (!validEvents.includes(eventType)) {
      return res.status(400).json({ message: 'Invalid event type' });
    }

    await pool.query(
      'INSERT INTO conversion_events (event_type, amount) VALUES ($1, $2)',
      [eventType, amount]
    );
    res.json({ success: true });
  } catch (error) {
    next(error);
  }
});

// GET /api/analytics/stats - retrieve conversion rate statistics
router.get('/stats', adminAuth, async (req, res, next) => {
  try {
    // 1. Guest starts and completions
    const startGuestRes = await pool.query("SELECT COUNT(*) FROM conversion_events WHERE event_type = 'checkout_start_guest'");
    const completeGuestRes = await pool.query("SELECT COUNT(*) FROM conversion_events WHERE event_type = 'checkout_complete_guest'");
    
    // 2. Registered starts and completions
    const startRegRes = await pool.query("SELECT COUNT(*) FROM conversion_events WHERE event_type = 'checkout_start_registered'");
    const completeRegRes = await pool.query("SELECT COUNT(*) FROM conversion_events WHERE event_type = 'checkout_complete_registered'");

    const startGuest = parseInt(startGuestRes.rows[0].count) || 0;
    const completeGuest = parseInt(completeGuestRes.rows[0].count) || 0;
    const startReg = parseInt(startRegRes.rows[0].count) || 0;
    const completeReg = parseInt(completeRegRes.rows[0].count) || 0;

    const guestConversionRate = startGuest > 0 ? (completeGuest / startGuest) * 100 : 0;
    const regConversionRate = startReg > 0 ? (completeReg / startReg) * 100 : 0;
    const guestAbandonmentRate = 100 - guestConversionRate;

    // 3. Average order values
    const aovGuestRes = await pool.query("SELECT COALESCE(AVG(total_amount), 0) as avg_val FROM orders WHERE is_guest = true AND payment_status = 'paid'");
    const aovRegRes = await pool.query("SELECT COALESCE(AVG(total_amount), 0) as avg_val FROM orders WHERE is_guest = false AND payment_status = 'paid'");
    const aovGuest = parseFloat(aovGuestRes.rows[0].avg_val);
    const aovReg = parseFloat(aovRegRes.rows[0].avg_val);

    // 4. Guest-to-registered user conversion (guests who registered with matching email)
    const totalGuestsRes = await pool.query("SELECT COUNT(DISTINCT guest_email) FROM orders WHERE is_guest = true");
    const convertedGuestsRes = await pool.query("SELECT COUNT(DISTINCT o.guest_email) FROM orders o JOIN users u ON o.guest_email = u.email WHERE o.is_guest = true");
    const totalGuests = parseInt(totalGuestsRes.rows[0].count) || 0;
    const convertedGuests = parseInt(convertedGuestsRes.rows[0].count) || 0;
    const guestToRegRate = totalGuests > 0 ? (convertedGuests / totalGuests) * 100 : 0;

    res.json({
      guestConversionRate,
      regConversionRate,
      guestAbandonmentRate,
      guestToRegRate,
      aovGuest,
      aovReg,
      startGuest,
      completeGuest,
      startReg,
      completeReg
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
