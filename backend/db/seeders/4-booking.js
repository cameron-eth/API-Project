'use strict';

const { SpotImage } = require('../models');

let options = {};
if (process.env.NODE_ENV === 'production') {
  options.schema = process.env.SCHEMA;
}

module.exports = {
  async up(queryInterface, Sequelize) {
    const spotImageData = [
      {
        spotId: 1,
        userId: 1,
        url: 'image1.jpg',
        preview: true,
      },
      {
        spotId: 2,
        userId: 2,
        url: 'image2.jpg',
        preview: false,
      },
      {
        spotId: 1,
        userId: 3,
        url: 'image3.jpg',
        preview: false,
      },
    ];

    await SpotImage.bulkCreate(spotImageData, { validate: true });
  },

  async down(queryInterface, Sequelize) {
    options.tableName = 'SpotImages';
    const Op = Sequelize.Op;

    const spotIdsToDelete = [1, 2, 3];

    const conditions = {
      spotId: {
        [Op.in]: spotIdsToDelete,
      },
    };

    return queryInterface.bulkDelete(options, conditions, {});
  },
};
