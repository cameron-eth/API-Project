const express = require('express')
const router = express.Router();
const { Spot } = require('../../db/models');
const spot = require('../../db/models/spot');


router.get('/spots', async (req, res) => {
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

router.get('/spots/current', async (req, res) => {

    try {
        const spots = await Spot.findAll({ where: { ownerId: req.spot } });
        const response = {
            Spots: spots
        }
        res.status(200).json(response)
    } catch(error) {
        console.error(error)
        res.status(500).json({ error: 'Internal server error'})
    }
})
  
router.get('/api/spots/:spotId', async (req, res) => {
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


module.exports = router;