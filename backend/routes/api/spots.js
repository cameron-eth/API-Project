const express = require('express')
const router = express.Router();
const { Spot, User, SpotImage, Review, ReviewImage, Booking } = require('../../db/models');
const { requireAuth } = require('../../utils/auth');
const { Op } = require('sequelize'); 
const { Sequelize } = require('sequelize');


const spot = require('../../db/models/spot');

router.get('/', async (req, res) => {
  try {
    // Extract and validate query parameters
    const { minLat, maxLat, minLng, maxLng, minPrice, maxPrice } = req.query;
    let { page, size } = req.query;

    page = parseInt(page) || 1;
    size = parseInt(size) || 20;

    if (page < 1 || size < 1 || (minPrice && minPrice < 0) || (maxPrice && maxPrice < 0)) {
      return res.status(400).json({
        message: 'Bad Request',
        errors: {
          page: "Page must be greater than or equal to 1",
          size: "Size must be greater than or equal to 1",
          minPrice: "Minimum price must be greater than or equal to 0",
          maxPrice: "Maximum price must be greater than or equal to 0"
        }
      });
    }

    // Define filter conditions
    const filter = {};

    if (minLat && maxLat) {
      filter.lat = {
        [Op.between]: [minLat, maxLat]
      };
    }

    if (minLng && maxLng) {
      filter.lng = {
        [Op.between]: [minLng, maxLng]
      };
    }

    if (minPrice && maxPrice) {
      filter.price = {
        [Op.between]: [minPrice, maxPrice]
      };
    }

    // Fetch spots based on filter and pagination
    const spots = await Spot.findAll({
      where: filter,
      offset: (page - 1) * size,
      limit: size,
      // Rest of your query here...
    });

    res.json({ Spots: spots, page, size });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});



router.get('/current', requireAuth, async (req, res) => {
  try {
    const userId = req.user.id;
    const spots = await Spot.findAll({
      where: { ownerId: userId },
      attributes: [
        'id',
        'ownerId',
        'address',
        'city',
        'state',
        'country',
        'lat',
        'lng',
        'name',
        'description',
        'price',
        "createdAt",
        "updatedAt",
        [
          Sequelize.literal(`ROUND(AVG("Reviews"."stars"), 1)`),
          'avgRating'
        ],
        [
          Sequelize.literal(`(
            SELECT "url" FROM "SpotImages"
            WHERE "spotId" = "Spot"."id"
            AND "preview" = true
            LIMIT 1
          )`),
          'previewImage'
        
        ],
      ],
      include: [
        {
          model: Review,
          as: 'Reviews',
          attributes: [],
        },
      ],
      raw: true,
      nest: true,
      subQuery: false,
      group: ['Spot.id'],
      includeIgnoreAttributes: false,
      having: Sequelize.where(Sequelize.fn('COUNT', Sequelize.col('Reviews.id')), '>', 0),
      order: [
        ['id', 'ASC'],
      ],
    });

    res.status(200).json({ Spots: spots });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});



router.get('/:spotId', async (req, res) => {
  const spotId = req.params.spotId;

  try {
    // Retrieve the spot
    const spot = await Spot.findByPk(spotId, {
      attributes: [
        'id',
        'ownerId',
        'address',
        'city',
        'state',
        'country',
        'lat',
        'lng',
        'name',
        'description',
        'price',
        'createdAt',
        'updatedAt',
      ],
      include: [
        {
          model: SpotImage,
          attributes: ['id', 'url', 'preview'],
        },
        {
          model: User,
          as: 'Owner',
          attributes: ['id', 'firstName', 'lastName'],
        },
        {
          model: Review,
          attributes: [],
          as: 'Reviews',
        },
      ],
    });

    // Check if the spot couldn't be found
    if (!spot || !spot.id) {
      return res.status(404).json({ message: "Spot couldn't be found" });
    }

    // Additional processing here if needed

    res.status(200).json(spot);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
});




router.post('/', requireAuth, async (req, res) => {
  try {
    const {
      address,
      city,
      state,
      country,
      lat,
      lng,
      name,
      description,
      price,
    } = req.body;

    // Dynamically set ownerId to req.user.id
    const ownerId = req.user.id;

    // Validate the request body
    if (!address || !city || !state || !country || !lat || !lng || !name || !description || !price) {
      return res.status(400).json({
        message: 'Bad Request',
        errors: {
          address: 'Street address is required',
          city: 'City is required',
          state: 'State is required',
          country: 'Country is required',
          lat: 'Latitude is not valid',
          lng: 'Longitude is not valid',
          name: 'Name must be less than 50 characters',
          description: 'Description is required',
          price: 'Price per day is required',
        },
      });
    }

    const newSpot = await Spot.create({
      ownerId,
      address,
      city,
      state,
      country,
      lat,
      lng,
      name,
      description,
      price,
    });

    res.status(201).json(newSpot);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
});


router.post('/:spotId/images', requireAuth, async (req, res) => {
  const { user } = req;
  const spotId = req.params.spotId;
  const { url, preview } = req.body;

  try {
    const spot = await Spot.findByPk(spotId);

    if (!spot) {
      return res.status(404).json({ message: "Spot couldn't be found" });
    }

    if(spot.ownerId !== user.id) return res.status(403).json({ message: "Forbidden" });


    const spotImage = await SpotImage.create({
      spotId: spot.id,
      url,
      preview,
    });

    // Exclude 'createdAt' and 'updatedAt' from the response
    const spotImageResponse = {
      id: spotImage.id,
      // spotId: spotImage.spotId,
      url: spotImage.url,
      preview: spotImage.preview,
    };

    res.status(200).json(spotImageResponse);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
});




router.put('/:spotId', requireAuth, async (req, res) => {
  const { user } = req;
  const spotId = req.params.spotId;
  const {
    address,
    city,
    state,
    country,
    lat,
    lng,
    name,
    description,
    price,
  } = req.body;

  try {
    const spot = await Spot.findByPk(spotId);

    if (!spot) {
      return res.status(404).json({ message: "Spot couldn't be found" });
    }

    if(spot.ownerId !== user.id) return res.status(403).json({ message: "Forbidden" });

    const errors = {};
    if (!address) {
      errors.address = 'Street address is required';
    }
    if (!city) {
      errors.city = 'City is required';
    }
    if (!state) {
      errors.state = 'State is required';
    }
    if (!country) {
      errors.country = 'Country is required';
    }
    if (isNaN(lat)) {
      errors.lat = 'Latitude is not valid';
    }
    if (isNaN(lng)) {
      errors.lng = 'Longitude is not valid';
    }
    if (!name || name.length > 50) {
      errors.name = name
        ? 'Name must be less than 50 characters'
        : 'Name is required';
    }
    if (!description) {
      errors.description = 'Description is required';
    }
    if (isNaN(price)) {
      errors.price = 'Price per day is required';
    }

    if (Object.keys(errors).length > 0) {
      return res.status(400).json({
        message: 'Bad Request',
        errors,
      });
    }

    // Update the spot
    await spot.update({
      address,
      city,
      state,
      country,
      lat,
      lng,
      name,
      description,
      price,
    });

    res.status(200).json(spot);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
});


router.delete('/:spotId', requireAuth, async (req, res) => {
  const { user } = req;
  const spotId = req.params.spotId;

  try {
    const spot = await Spot.findByPk(spotId);

    if (!spot) {
      return res.status(404).json({ message: "Spot couldn't be found" });
    }

    // Check if the spot belongs to the current user
    if (spot.ownerId !== user.id) {
      return res.status(403).json({ message: 'Forbidden' });
    }

    // Find and delete associated bookings
    const bookings = await Booking.findAll({
      where: {
        spotId: spot.id,
      },
    });

    // Delete all associated bookings
    for (const booking of bookings) {
      await booking.destroy();
    }

    // Delete the spot after related bookings are deleted
    await spot.destroy();

    res.status(200).json({ message: 'Successfully deleted' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
});




router.get('/:spotId/reviews', async (req, res) => {
  const spotId = req.params.spotId;

  try {
    // Find all reviews that belong to the specified spot
    const reviews = await Review.findAll({
      where: { spotId: spotId }, // Specify the condition as an object
      include: [
        {
          model: User,
          attributes: ['id', 'firstName', 'lastName'],
        },
        {
          model: ReviewImage,
          attributes: ['id', 'url']
        },
      ],
    });

    if (!reviews || reviews.length === 0) {
      return res.status(404).json({ message: "Spot couldn't be found" });
    }

    const response = {
      Reviews: reviews.map(review => ({
        "id": review.id,
        "userId": review.User.id,
        "spotId": review.spotId,
        "review": review.review,
        "stars": review.stars,
        "createdAt": review.createdAt,
        "updatedAt": review.updatedAt,
        "User": {
          "id": review.User.id,
          "firstName": review.User.firstName,
          "lastName": review.User.lastName,
        },
        "ReviewImages": review.ReviewImages.map(image => ({
          "id": image.id,
          "url": image.url,
        })),
      })),
    };

    res.status(200).json(response);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/:spotId/reviews', requireAuth, async (req, res) => {
  const { user } = req;
  const spotId = req.params.spotId;
  const { review, stars } = req.body;

  try {
    // Check if the spot exists
    const spot = await Spot.findByPk(spotId);

    if (!spot) {
      return res.status(404).json({ message: "Spot couldn't be found" });
    }

    // Check if the user already has a review for this spot
    const existingReview = await Review.findOne({
      where: {
        spotId: spotId,
        userId: user.id,
      },
    });

    if (existingReview) {
      return res.status(500).json({ message: 'User already has a review for this spot' });
    }

    // Validate the request body
    if (!review || !stars || isNaN(stars) || stars < 1 || stars > 5) {
      return res.status(400).json({
        message: 'Bad Request',
        errors: {
          review: 'Review text is required',
          stars: 'Stars must be an integer from 1 to 5',
        },
      });
    }

    // Create a new review
    const newReview = await Review.create({
      userId: user.id,
      spotId: spot.id,
      review,
      stars,
    });

    // Switch the order of "createdAt" and "updatedAt" in the response
    const response = {
      id: newReview.id,
      userId: newReview.userId,
      spotId: newReview.spotId,
      review: newReview.review,
      stars: newReview.stars,
      createdAt: newReview.createdAt, // "createdAt" comes first
      updatedAt: newReview.updatedAt, // "updatedAt" comes last
    };

    res.status(201).json(response);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/:spotId/bookings', requireAuth, async (req, res) => {
  const { user } = req;
  const spotId = req.params.spotId;

  try {
    // Check if the user is the owner of the spot
    const spot = await Spot.findByPk(spotId);

    if (!spot) {
      return res.status(404).json({ message: "Spot couldn't be found" });
    }

    let bookings = [];

    if (user.id === spot.ownerId) {
      // If the user is the owner, include user details in response
      bookings = await Booking.findAll({
        where: { spotId },
        include: {
          model: User,
          attributes: ['id', 'firstName', 'lastName'],
        },
      });
    } else {
      // If the user is not the owner, only return booking details
      bookings = await Booking.findAll({
        where: { spotId },
        attributes: ['spotId', 'startDate', 'endDate'],
      });
    }

    const response = {
      Bookings: bookings,
    };

    res.status(200).json(response);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/:spotId/bookings', requireAuth, async (req, res) => {
  const { user } = req;
  const spotId = req.params.spotId;
  const { startDate, endDate } = req.body;

  try {
    // Check if the spot exists
    const spot = await Spot.findByPk(spotId);

    if (!spot) {
      return res.status(404).json({ message: 'Spot couldn\'t be found' });
    }

    // Check if the spot is owned by the current user
    if (spot.ownerId === user.id) {
      return res.status(403).json({ message: "Forbidden" });
    }

    // Check if the end date is the same as the start date
    if (startDate === endDate) {
      return res.status(400).json({ message: 'End date cannot be the same as the start date' });
    }

    // Check if the end date is before the start date
    if (new Date(endDate) < new Date(startDate)) {
      return res.status(400).json({ message: 'End date cannot be before the start date' });
    }

    // Check for booking conflicts
    const existingBooking = await Booking.findOne({
      where: {
        spotId: spot.id,
        startDate: {
          [Sequelize.Op.lte]: endDate,
        },
        endDate: {
          [Sequelize.Op.gte]: startDate,
        },
      },
    });

    if (existingBooking) {
      return res.status(403).json({
        message: 'Sorry, this spot is already booked for the specified dates',
        errors: {
          startDate: 'Start date conflicts with an existing booking',
          endDate: 'End date conflicts with an existing booking',
        },
      });
    }

    // Check if the booking is for a past date
    const currentDate = new Date();
    if (new Date(startDate) < currentDate || new Date(endDate) < currentDate) {
      return res.status(403).json({ message: 'Past bookings cannot be created' });
    }

    // Check if the new booking's start date is on an existing end date
    const existingEndDateBooking = await Booking.findOne({
      where: {
        spotId: spot.id,
        startDate: {
          [Sequelize.Op.eq]: endDate,
        },
      },
    });

    if (existingEndDateBooking) {
      return res.status(400).json({
        message: 'Start date cannot be on an existing end date',
      });
    }

    // Check if the new booking's end date is on an existing start date
    const existingStartDateBooking = await Booking.findOne({
      where: {
        spotId: spot.id,
        endDate: {
          [Sequelize.Op.eq]: startDate,
        },
      },
    });

    if (existingStartDateBooking) {
      return res.status(400).json({
        message: 'End date cannot be on an existing start date',
      });
    }

    // Create a new booking
    const newBooking = await Booking.create({
      spotId: spot.id,
      userId: user.id,
      startDate,
      endDate,
    });

    const response = {
      id: newBooking.id,
      spotId: newBooking.spotId,
      userId: newBooking.userId,
      startDate: newBooking.startDate,
      endDate: newBooking.endDate,
      createdAt: newBooking.createdAt,
      updatedAt: newBooking.updatedAt,
    };

    res.status(200).json(response);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;