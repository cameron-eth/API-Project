
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
        // Add columns from Reviews for aggregation
        [
          Sequelize.fn('COUNT', Sequelize.col('Reviews.id')),
          'numReviews',
        ],
        [
          Sequelize.fn('ROUND', Sequelize.fn('AVG', Sequelize.col('Reviews.stars')), 1),
          'avgStarRating',
        ],
        // Include 'SpotImages.id' and 'SpotImages.url' in GROUP BY
        'SpotImages.id',
        'SpotImages.url',
        // Include 'Owner.id' in GROUP BY
        'Owner.id',
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
      // Specify the columns to group by
      group: [
        'Spot.id',
        'SpotImages.id',
        'SpotImages.url',
        'Owner.id', // Add 'Owner.id' to the GROUP BY clause
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