const express = require('express');
const router = express.Router();
const { Booking, Spot } = require('../../db/models');
const { requireAuth } = require('../../utils/auth');

// GET endpoint to get all of the current user's bookings
router.get('/current', requireAuth, async (req, res) => {
  const { user } = req;

  try {
    const bookings = await Booking.findAll({
      where: { userId: user.id },
    });

    const response = {
      Bookings: bookings,
    };

    res.status(200).json(response);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
});
module.exports = router;