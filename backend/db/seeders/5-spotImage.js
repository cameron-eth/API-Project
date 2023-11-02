'use strict';

const { SpotImage } = require('../models');

let options = {};
if (process.env.NODE_ENV === 'production') {
  options.schema = process.env.SCHEMA;
  options.tableName = 'SpotImages'; // Define the table name in the options object
}

module.exports = {
  async up(queryInterface, Sequelize) {
    const spotImageData = [
      {
        spotId: 1,
        url: 'image-1.jpg',
        preview: true,
      },
      {
        spotId: 2,
        url: 'image-2.jpg',
        preview: false,
      },
      {
        spotId: 1,
        url: 'image-3.jpg',
        preview: false,
      },
    ];

    await SpotImage.bulkCreate(spotImageData, { validate: true, individualHooks: true, ...options });
  },

  async down(queryInterface, Sequelize) {
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
