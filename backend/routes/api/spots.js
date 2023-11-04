const express = require('express')
const router = express.Router();
const { Spot, User, SpotImage, Review, ReviewImage, Booking } = require('../../db/models');
const { requireAuth } = require('../../utils/auth');
const { Op } = require('sequelize'); 
const { Sequelize } = require('sequelize');


router.get('/', async (req, res) => {
  // Extract query parameters from the request with default values
  const { page = 1, size = 20, minLat, maxLat, minLng, maxLng, minPrice, maxPrice } = req.query;

  // Validate query parameters
  const errors = {};

  if (isNaN(page) || page < 1 || page > 10) {
    errors.page = 'Page must be between 1 and 10';
  }

  if (isNaN(size) || size < 1 || size > 20) {
    errors.size = 'Size must be between 1 and 20';
  }

  if (minLat && (isNaN(minLat) || minLat < -90 || minLat > 90)) {
    errors.minLat = 'Minimum latitude is invalid';
  }

  if (maxLat && (isNaN(maxLat) || maxLat < -90 || maxLat > 90)) {
    errors.maxLat = 'Maximum latitude is invalid';
  }

  if (minLng && (isNaN(minLng) || minLng < -180 || minLng > 180)) {
    errors.minLng = 'Minimum longitude is invalid';
  }

  if (maxLng && (isNaN(maxLng) || maxLng < -180 || maxLng > 180)) {
    errors.maxLng = 'Maximum longitude is invalid';
  }

  if (minPrice && (isNaN(minPrice) || minPrice < 0)) {
    errors.minPrice = 'Minimum price must be greater than or equal to 0';
  }

  if (maxPrice && (isNaN(maxPrice) || maxPrice < 0)) {
    errors.maxPrice = 'Maximum price must be greater than or equal to 0';
  }

  if (Object.keys(errors).length > 0) {
    return res.status(400).json({
      message: 'Bad Request',
      errors,
    });
  }

  // Define the query to filter spots based on the query parameters
  const spotQuery = {
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
      [
        Sequelize.fn('COALESCE', Sequelize.fn('ROUND', Sequelize.col('Reviews.stars'), 1), null),
        'avgRating',
      ],
    ],
    include: [
      {
        model: Review,
        as: 'Reviews',
        attributes: [],
      },
      {
        model: SpotImage,
        attributes: ['url'],
        where: { preview: true },
        required: false,
      },
    ],
    raw: true,
    nest: true,
    group: ['Spot.id', 'Reviews.stars'], // Include Reviews.stars in GROUP BY clause
    includeIgnoreAttributes: false,
    order: [['id', 'ASC']],
  };

  // Initialize the 'where' object as an empty object
  spotQuery.where = {};

  // Apply additional filters based on query parameters
  if (minLat && maxLat && minLng && maxLng) {
    spotQuery.where.lat = { [Sequelize.Op.between]: [minLat, maxLat] };
    spotQuery.where.lng = { [Sequelize.Op.between]: [minLng, maxLng] };
  }

  if (minPrice && maxPrice) {
    spotQuery.where.price = { [Sequelize.Op.between]: [minPrice, maxPrice] };
  }

  // Pagination
  const offset = (page - 1) * size;

  try {
    const spots = await Spot.findAll({
      ...spotQuery,
      offset,
    });

    res.status(200).json({ Spots: spots, page: Number(page), size: Number(size) });
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
        [
          Sequelize.fn('ROUND', Sequelize.fn('AVG', Sequelize.col('Reviews.stars')), 1),
          'avgRating',
        ],
        [
          Sequelize.fn('COALESCE', Sequelize.fn('MAX', Sequelize.col('SpotImages.url')), null),
          'previewImage',
        ],
      ],
      include: [
        {
          model: Review,
          as: 'Reviews',
          attributes: [],
        },
        {
          model: SpotImage,
          where: { preview: true },
          attributes: [],
        },
      ],
      raw: true,
      nest: true,
      group: ['Spot.id'],
      includeIgnoreAttributes: false,
      order: [['id', 'ASC']],
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
        [
          Sequelize.literal(`(
            SELECT COUNT(*) FROM "Reviews"
            WHERE "spotId" = "Spot"."id"
          )`),
          'numReviews'
        ],
        [
          Sequelize.literal(`ROUND(AVG("Reviews"."stars"), 1)`),
          'avgStarRating'
        ],
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

    if (spot.ownerId !== user.id) return res.status(403).json({ message: "Forbidden" });

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
    if (isNaN(lat) || lat < -90 || lat > 90) {
      errors.lat = 'Latitude is not valid';
    }
    if (isNaN(lng) || lng < -180 || lng > 180) {
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
    if (isNaN(price) || !price || price < 0) {
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
    res.status(500).json({ message: 'Internal server error' });
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


// Route for creating a new booking
router.post('/:spotId/bookings', requireAuth, async (req, res) => {
  const { user } = req;
  const spotId = req.params.spotId;
  const { startDate, endDate } = req.body;

  try {
    // Check if the spot exists
    const spot = await Spot.findByPk(spotId);

    if (!spot) {
      return res.status(404).json({ message: "Spot couldn't be found" });
    }

    // Check if the spot is owned by the current user
    if (spot.ownerId === user.id) {
      return res.status(403).json({ message: "Forbidden" });
    }

    // Check if the end date is before the start date
    if (new Date(endDate) <= new Date(startDate)) {
      return res.status(400).json({
        message: 'Bad Request',
        errors: {
          startDate: 'Start date must be before end date',
          endDate: 'End date must be after the start date',
        },
      });
    }

    // Check for booking conflicts
    const conflictingBooking = await Booking.findOne({
      where: {
        spotId: spot.id,
        [Op.or]: [
          {
            startDate: {
              [Op.lte]: endDate,
            },
            endDate: {
              [Op.gte]: startDate,
              // [Op.gte]: endDate

            },
          },
          {
            startDate: {
              [Op.gte]: startDate,
              [Op.lte]: endDate,
            },
          },
        ],
      },
    });

    if (conflictingBooking) {
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
      return res.status(400).json({
        message: 'Bad Request',
        errors: {
          startDate: 'Booking cannot be on a past date',
          endDate: 'Booking cannot be on a past date',
        },
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