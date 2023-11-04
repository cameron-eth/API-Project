const express = require('express')
const router = express.Router();
const { Spot, User, SpotImage, Review, ReviewImage } = require('../../db/models');
const { requireAuth } = require('../../utils/auth');

router.get('/current', requireAuth, async (req, res) => {
  const { user } = req;

  try {
    const reviews = await Review.findAll({
      where: { userId: user.id },
      include: [
        {
          model: User,
          as: 'User',
        },
        {
          model: Spot,
          as: 'Spot',
          include: [
            {
              model: SpotImage,  // Include the SpotImage model
              as: 'SpotImages',
              where: {
                preview: true,
              },
              required: false,
              attributes: ['url'], // Include the 'url' attribute
            },
          ],
        },
        {
          model: ReviewImage,
          as: 'ReviewImages',
        },
      ],
    });

    const response = {
      "Reviews": reviews.map(review => ({
        "id": review.id,
        "userId": review.userId,
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
        "Spot": {
          "id": review.Spot.id,
          "ownerId": review.Spot.ownerId,
          "address": review.Spot.address,
          "city": review.Spot.city,
          "state": review.Spot.state,
          "country": review.Spot.country,
          "lat": review.Spot.lat,
          "lng": review.Spot.lng,
          "name": review.Spot.name,
          "price": review.Spot.price,
          "previewImage": review.Spot.SpotImages[0] ? review.Spot.SpotImages[0].url : null, // Get the first preview image URL
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


router.post('/:reviewId/images', requireAuth, async (req, res) => {
  const { user } = req;
  const reviewId = req.params.reviewId;
  const { url } = req.body;

  try {
    // Check if the review exists
    const review = await Review.findByPk(reviewId);

    if (!review) {
      return res.status(404).json({ message: "Review couldn't be found" });
    }

    // Check if the user making the request is the owner of the review
    if (user.id !== review.userId) {
      return res.status(403).json({ message: 'Forbidden' });
    }

    const existingImages = await ReviewImage.findAndCountAll({
      where: { reviewId: review.id },
    });

    if (existingImages.count >= 10) {
      return res.status(403).json({
        message: 'Maximum number of images for this resource was reached',
      });
    }

    // Create a new review image
    const newImage = await ReviewImage.create({
      reviewId: review.id,
      url,
    });

    const response = {
      id: newImage.id,
      url: newImage.url
    }
    res.status(200).json(response);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Edit a Review (Update)
router.put('/:reviewId', requireAuth, async (req, res) => {
  const { user } = req;
  const reviewId = req.params.reviewId;
  const { review, stars } = req.body;
  
  try {
    // Find the review by its primary key
    const existingReview = await Review.findByPk(reviewId);

    if (!existingReview) {
      return res.status(404).json({ message: "Review couldn't be found" });
    }

    // Ensure that the review belongs to the current user
    if (existingReview.userId !== user.id) {
      return res.status(403).json({ message: "Forbidden" });
    }

    // Validate the request body
    if (!review || !stars || stars < 1 || stars > 5) {
      return res.status(400).json({
        message: 'Bad Request',
        errors: {
          review: 'Review text is required',
          stars: 'Stars must be an integer from 1 to 5',
        },
      });
    }

    // Update the review
    existingReview.review = review;
    existingReview.stars = stars;
    await existingReview.save();

    // Format the response
    const response = {
      id: existingReview.id,
      userId: existingReview.userId,
      spotId: existingReview.spotId,
      review: existingReview.review,
      stars: existingReview.stars,
      createdAt: existingReview.createdAt,
      updatedAt: existingReview.updatedAt,
    };

    res.status(200).json(response);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
});


  router.put('/:reviewId/images', requireAuth, async (req, res) => {
    const { user } = req;
    const reviewId = req.params.reviewId;
    const { review, stars } = req.body;
  
    try {
      // Find the review by its primary key
      const existingReview = await Review.findByPk(reviewId);
  
      if (!existingReview) {
        return res.status(404).json({ message: "Review couldn't be found" });
      }
  
      // Ensure that the review belongs to the current user
      if (existingReview.userId !== user.id) {
        return res.status(403).json({ message: "Unauthorized" });
      }
  
      // Validate the request body
      if (!review || !stars || stars < 1 || stars > 5) {
        return res.status(400).json({
          message: 'Bad Request',
          errors: {
            review: 'Review text is required',
            stars: 'Stars must be an integer from 1 to 5',
          },
        });
      }
  
      existingReview.review = review;
      existingReview.stars = stars;
      await existingReview.save();
  
      const response = {
        id: existingReview.id,
        userId: existingReview.userId, 
        spotId: existingReview.spotId, 
        review: existingReview.review,
        stars: existingReview.stars,
        createdAt: existingReview.createdAt,
        updatedAt: existingReview.updatedAt,
      };
  
      res.status(200).json(response);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });
  
  

router.delete('/:reviewId', requireAuth, async (req, res) => {
    const { user } = req;
    const reviewId = req.params.reviewId;
  
    try {
      // Find the review by its primary key
      const existingReview = await Review.findByPk(reviewId);
  
      if (!existingReview) {
        return res.status(404).json({ message: "Review couldn't be found" });
      }
  
      // Ensure that the review belongs to the current user
      if (existingReview.userId !== user.id) {
        return res.status(403).json({ message: "Forbidden" });
      }
  
      // Delete the review
      await existingReview.destroy();
  
      res.status(200).json({ message: 'Successfully deleted' });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Internal server error' });
    }
});
  

module.exports = router;