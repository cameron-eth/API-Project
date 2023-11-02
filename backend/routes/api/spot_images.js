const express = require('express')
const router = express.Router();
const { Spot, User, SpotImage, Review, ReviewImage } = require('../../db/models');
const { requireAuth } = require('../../utils/auth');

router.delete('/:imageId', requireAuth, async (req, res) => {
  const { user } = req;
  const imageId = req.params.imageId;

  // Validate the "imageId" as a valid integer
  // if (!Number.isInteger(imageId) || imageId === null) {
  //   return res.status(400).json({ message: 'Forbidden' });
  // }

  try {
    // Find the Spot Image by ID to get the spotId
    const spotImage = await SpotImage.findByPk(imageId);

    if (!spotImage) {
      return res.status(404).json({ message: "Spot Image couldn't be found" });
    }

    // Use the spotId from the Spot Image to find the associated Spot
    const spot = await Spot.findByPk(spotImage.spotId);

    if (!spot) {
      return res.status(404).json({ message: "Spot couldn't be found" });
    }

    // Check if the user is the owner of the Spot
    if (user.id === spot.ownerId) {
      // If the user is the owner, delete the Spot Image
      await spotImage.destroy();
      res.status(200).json({ message: "Successfully deleted" });
    } else {
      res.status(403).json({ message: "Forbidden" });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
});
;


module.exports = router;