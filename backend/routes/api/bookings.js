const express = require('express');
const router = express.Router();
const { Booking, Spot } = require('../../db/models');
const { requireAuth } = require('../../utils/auth');
const { Sequelize, Op } = require('sequelize'); // Assuming you have Sequelize and Op already imported



// GET endpoint to get all of the current user's bookings
router.get('/current', requireAuth, async (req, res) => {
    const { user } = req;
  
    try {
      const bookings = await Booking.findAll({
        where: { userId: user.id },
        include: Spot,
      });
  
      const response = {
        "Bookings": bookings.map(booking => ({
          "id": booking.id,
          "spotId": booking.spotId,
          "Spot": {
            "id": booking.Spot.id,
            "ownerId": booking.Spot.ownerId,
            "address": booking.Spot.address,
            "city": booking.Spot.city,
            "state": booking.Spot.state,
            "country": booking.Spot.country,
            "lat": booking.Spot.lat,
            "lng": booking.Spot.lng,
            "name": booking.Spot.name,
            "price": booking.Spot.price,
            "previewImage": booking.Spot.previewImage || null
          },
          "userId": booking.userId,
          "startDate": booking.startDate,
          "endDate": booking.endDate,
          "createdAt": booking.createdAt,
          "updatedAt": booking.updatedAt
        }))
      };
  
      res.status(200).json(response);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Internal server error' });
    }
});
  


// PUT endpoint to update a booking
router.put('/:bookingId', requireAuth, async (req, res) => {
  const { user } = req;
  const bookingId = req.params.bookingId;
  const { startDate, endDate } = req.body;

  try {
    // Check if the booking exists
    const booking = await Booking.findByPk(bookingId);

    if (!booking) {
      return res.status(404).json({ message: 'Booking couldn\'t be found' });
    }

    // Check if the booking belongs to the current user
    if (booking.userId !== user.id) {
      return res.status(403).json({ message: 'Forbidden' });
    }

    // Check if the booking's end date is in the future
    const currentDate = new Date();
    if (new Date(booking.endDate) < currentDate) {
      return res.status(403).json({ message: 'Past bookings can\'t be modified' });
    }

    const errorResponse = {};

    // Check if the end date is the same as the start date
    if (startDate === endDate) {
      errorResponse.startDate = 'Start date cannot be the same as the end date';
    }

    if (endDate === startDate) {
      errorResponse.endDate = 'Start date cannot be the same as the end date';
    }

    // Check if the end date is before the start date
    if (new Date(endDate) < new Date(startDate)) {
      errorResponse.endDate = 'End date cannot be before the start date';
    }

    // Check if the new start date is on an existing end date
    const conflictsWithin = await Booking.findOne({
      where: {
        id: booking.id,
        startDate: {
          [Sequelize.Op.lte]: endDate,
        },
        endDate: {
          [Sequelize.Op.gte]: startDate,
        },
      },
    });

    if (conflictsWithin) {
      errorResponse.startDate = 'Start date cannot be on an existing end date';
    }

    // Check if the start date is on an existing end date in other bookings
    const spot = await Spot.findByPk(booking.spotId);
    const conflictsWithOtherBookings = await Booking.findOne({
      where: {
        spotId: booking.spotId,
        startDate: {
          [Sequelize.Op.lte]: endDate,
        },
        endDate: {
          [Sequelize.Op.gte]: startDate,
        },
        id: {
          [Sequelize.Op.not]: bookingId, // Exclude the current booking
        },
      },
    });

    if (conflictsWithOtherBookings) {
      errorResponse.startDate = 'Start date cannot be on an existing end date';
    }

    // Check if the booking is for a past date
    if (new Date(startDate) < currentDate || new Date(endDate) < currentDate) {
      errorResponse.message = 'Past bookings can\'t be modified';
    }

    if (Object.keys(errorResponse).length > 0) {
      return res.status(400).json({
        message: 'Bad Request',
        errors: errorResponse,
      });
    }

    // Update the booking
    await booking.update({
      startDate,
      endDate,
    });

    // Fetch the updated booking
    const updatedBooking = await Booking.findByPk(bookingId);

    res.status(200).json(updatedBooking);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
});


router.delete('/:bookingId', requireAuth, async (req, res) => {
  const { user } = req;
  const bookingId = req.params.bookingId;

  try {
    // Check if the booking exists
    const existingBooking = await Booking.findByPk(bookingId);

    if (!existingBooking) {
      return res.status(404).json({ message: "Booking couldn't be found" });
    }

    // Check if the booking belongs to the current user or if the spot belongs to the current user
    if (existingBooking.userId !== user.id) {
      // Check if the spot belongs to the current user
      const spot = await Spot.findByPk(existingBooking.spotId);

      if (!spot || spot.ownerId !== user.id) {
        return res.status(403).json({ message: "Forbidden" });
      }
    }

    // Check if the booking has already started
    const currentDate = new Date();
    if (new Date(existingBooking.startDate) < currentDate) {
      return res.status(403).json({ message: "Bookings that have been started can't be deleted" });
    }

    // Delete the booking
    await existingBooking.destroy();

    res.status(200).json({ message: 'Successfully deleted' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

  
module.exports = router;