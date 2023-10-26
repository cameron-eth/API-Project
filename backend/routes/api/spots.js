const express = require('express')
const router = express.Router();
const { Spot, User, SpotImage, Review, ReviewImage } = require('../../db/models');
const { requireAuth } = require('../../utils/auth');

const spot = require('../../db/models/spot');


router.get('/', async (req, res) => {
    try {
      const spots = await Spot.findAll();
  
      const response = {
        Spots: spots,
      };
  
      res.status(200).json(response);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Internal server error' });
    }
});

router.get('/current', requireAuth, async (req, res) => {
  const { user } = req;
  try {
    const spots = await Spot.findAll({ where: { ownerId: user.id } });
    const response = {
      Spots: spots,
    };
    res.status(200).json(response);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
});
  


router.get('/:spotId', async (req, res) => {
  const spotId = req.params.spotId;
  
  try {
    const spot = await Spot.findByPk(spotId, {
      include: [
        {
          model: SpotImage,
        },
        {
          model: User,
          as: 'Owner', 
        },
      ],
    });

    if (!spot) {
      return res.status(404).json({ message: 'Spot couldn\'t be found' });
    }

    res.status(200).json(spot);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
});


router.post('/', requireAuth ,async (req, res) => {
  try {
    // Extract data from the request body
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

    // Create a new spot
    const newSpot = await Spot.create({
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

    // Return a successful response with the created spot
    res.status(201).json(newSpot);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST endpoint to add an image to a spot
router.post('/:spotId/images', requireAuth ,async (req, res) => {
  const { user } = req;
  const spotId = req.params.spotId;
  const { url, preview } = req.body;


  //Needs AUTH Middleware


  

  try {
    // Check if the spot exists and belongs to the current user
    const spot = await Spot.findOne({ where: { id: spotId, ownerId: user.id } });

    if (!spot) {
      return res.status(404).json({ message: 'Spot couldn\'t be found' });
    }

    // Create a new spot image
    const spotImage = await SpotImage.create({
      spotId: spot.id,
      url,
      preview,
    });

    res.status(200).json(spotImage);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
});



// PUT endpoint to edit and update a spot
router.put('/:spotId', requireAuth ,async (req, res) => {
  const { user } = req;
  const spotId = req.params.spotId;
  const { address, city, state, country, lat, lng, name, description, price } = req.body;

  try {
    // Check if the spot exists and belongs to the current user
    const spot = await Spot.findOne({ where: { id: spotId, ownerId: user.id } });

    if (!spot) {
      return res.status(404).json({ message: 'Spot couldn\'t be found' });
    }

    // Validation checks for spot data
    if (!address) {
      return res.status(400).json({
        message: 'Bad Request',
        errors: {
          address: 'Street address is required'
        }
      });
    }

    if (!city) {
      return res.status(400).json({
        message: 'Bad Request',
        errors: {
          city: 'City is required'
        }
      });
    }

    if (!state) {
      return res.status(400).json({
        message: 'Bad Request',
        errors: {
          state: 'State is required'
        }
      });
    }

    if (!country) {
      return res.status(400).json({
        message: 'Bad Request',
        errors: {
          country: 'Country is required'
        }
      });
    }

    if (isNaN(lat)) {
      return res.status(400).json({
        message: 'Bad Request',
        errors: {
          lat: 'Latitude is not valid'
        }
      });
    }

    if (isNaN(lng)) {
      return res.status(400).json({
        message: 'Bad Request',
        errors: {
          lng: 'Longitude is not valid'
        }
      });
    }

    if (!name || name.length > 50) {
      return res.status(400).json({
        message: 'Bad Request',
        errors: {
          name: name ? 'Name must be less than 50 characters' : 'Name is required'
        }
      });
    }

    if (!description) {
      return res.status(400).json({
        message: 'Bad Request',
        errors: {
          description: 'Description is required'
        }
      });
    }

    if (isNaN(price)) {
      return res.status(400).json({
        message: 'Bad Request',
        errors: {
          price: 'Price per day is required'
        }
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




router.delete('/:spotId', requireAuth ,async (req, res) => {
  const { user } = req;
  const spotId = req.params.spotId;

  //Needs AUTH Middleware


  try {
    // Check if the spot exists and belongs to the current user
    const spot = await Spot.findByPk(spotId);

    if (!spot) {
      return res.status(404).json({ message: 'Spot couldn\'t be found' });
    }

    if (spot.ownerId !== user.id) {
      return res.status(403).json({ message: 'You are not authorized to delete this spot' });
    }

    // Delete the spot
    await spot.destroy();

    res.status(200).json({ message: 'Successfully deleted' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error ya dig' });
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
      return res.status(404).json({ message: 'No reviews found for this spot' });
    }

    const response = {
      Reviews: reviews,
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

    res.status(201).json(newReview);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
});



module.exports = router;