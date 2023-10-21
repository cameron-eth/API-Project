'use strict';

const { ReviewImage } = require('../models');

let options = {};
if (process.env.NODE_ENV === 'production') {
  options.schema = process.env.SCHEMA;
}

module.exports = {
  async up(queryInterface, Sequelize) {
    const reviewImageData = [
      {
        reviewId: 1,
        url: 'review_image1.jpg',
        preview: true,
      },
      {
        reviewId: 2,
        url: 'review_image2.jpg',
        preview: false,
      },
      {
        reviewId: 1,
        url: 'review_image3.jpg',
        preview: false,
      },
    ];

    await ReviewImage.bulkCreate(reviewImageData, { validate: true });
  },

  async down(queryInterface, Sequelize) {
    options.tableName = 'ReviewImages';
    const Op = Sequelize.Op;

    const reviewIdsToDelete = [1, 2, 3];

    const conditions = {
      reviewId: {
        [Op.in]: reviewIdsToDelete,
      },
    };

    return queryInterface.bulkDelete(options, conditions, {});
  },
};
