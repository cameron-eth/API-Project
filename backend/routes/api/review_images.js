const express = require('express')
const router = express.Router();
const { Spot, User, SpotImage, Review, ReviewImage, Booking } = require('../../db/models');
const { requireAuth } = require('../../utils/auth');
const { Op } = require('sequelize'); 
const { Sequelize } = require('sequelize');

// router.delete('/:imageId', requireAuth, async (req, res) => {
//   const { user } = req;
//   const imageId = req.params.imageId;

//   try {
//     // Find the review image by its primary key
//     const existingImage = await ReviewImage.findByPk(imageId);

//     if (!existingImage) {
//       return res.status(404).json({ message: "Review Image couldn't be found" });
//     }

//     // Find the associated review by its ID
//     const associatedReview = await Review.findByPk(existingImage.reviewId);

//     if (!associatedReview) {
//       return res.status(404).json({ message: "Review couldn't be found" });
//     }

//     // Check if the associated review belongs to the current user
//     if (associatedReview.userId !== user.id) {
//       return res.status(403).json({ message: "Forbidden" });
//     }

//     // Delete the review image
//     await existingImage.destroy();

//     res.status(200).json({ message: 'Successfully deleted' });
//   } catch (error) {
//     console.error(error);
//     res.status(500).json({ error: 'Internal server error' });
//   }
// });

router.delete('/:imageId', requireAuth, async (req, res) => {
  const { user } = req;
  const imageId = req.params.imageId;

  // Validate that imageId is not null or undefined
  if (!imageId || isNaN(imageId)) {
    return res.status(403).json({ message: "Forbidden" });
  }

  try {
    // Find the review image by its primary key
    const existingImage = await ReviewImage.findByPk(imageId);

    if (!existingImage) {
      return res.status(404).json({ message: "Review Image couldn't be found" });
    }

    // Find the associated review by its ID
    const associatedReview = await Review.findByPk(existingImage.reviewId);

    if (!associatedReview) {
      return res.status(404).json({ message: "Review couldn't be found" });
    }

    // Check if the associated review belongs to the current user
    if (associatedReview.userId !== user.id) {
      return res.status(403).json({ message: "Forbidden" });
    }

    // Delete the review image
    await existingImage.destroy();

    res.status(200).json({ message: 'Successfully deleted' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
});


module.exports = router;
