const express = require('express')
const router = express.Router();
const { Spot, User, SpotImage, Review, ReviewImage } = require('../../db/models');
const { requireAuth } = require('../../utils/auth');

router.get('/current', requireAuth ,async (req, res) => {

    //Needs Middleware
    const { user } = req
    try {
        const reviews = await Review.findAll({ where: { userId: user.id  } });
        const response = {
            Reviews: reviews
        }
        res.status(200).json(response)
    } catch(error) {
        console.error(error)
        res.status(500).json({ error: 'Internal server error'})
    }
})

router.post('/:reviewId/images', requireAuth, async (req, res) => {
    const { user } = req;
    const reviewId = req.params.reviewId;
    const { url } = req.body;
  
    try {
      // Check if the review exists and belongs to the current user
      const review = await Review.findOne({
        where: { id: reviewId, userId: user.id },
      });
  
      if (!review) {
        return res.status(404).json({ message: "Review couldn't be found" });
      }
  
      // Check if the maximum number of images per resource was reached (e.g., 10 images)
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
  
      res.status(200).json(newImage);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Internal server error' });
    }
});
  
router.put('/:reviewId', requireAuth, async (req, res) => {
    const { user } = req;
    const reviewId = req.params.reviewId;
    const { review, stars } = req.body;
  
    try {
      // Check if the review exists and belongs to the current user
      const existingReview = await Review.findOne({
        where: { id: reviewId, userId: user.id },
      });
  
      if (!existingReview) {
        return res.status(404).json({ message: "Review couldn't be found" });
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
  
      res.status(200).json(existingReview);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  router.delete('/:reviewId', requireAuth, async (req, res) => {
  const { user } = req;
  const reviewId = req.params.reviewId;

  try {
    // Check if the review exists and belongs to the current user
    const existingReview = await Review.findOne({
      where: { id: reviewId, userId: user.id },
    });

    if (!existingReview) {
      return res.status(404).json({ message: "Review couldn't be found" });
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