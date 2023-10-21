'use strict';

const { Review } = require('../models');
const bcrypt = require('bcryptjs');

let options = {};
if (process.env.NODE_ENV === 'production') {
  options.schema = process.env.SCHEMA; 
}

module.exports = {
  async up(queryInterface, Sequelize) {
    const reviewData = [
      {
        spotId: 1,
        userId: 1,
        review: 'This is an excellent spot!',
        stars: 5,
      },
      {
        spotId: 2,
        userId: 2,
        review: 'I had a great time here.',
        stars: 4,
      },
      {
        spotId: 1,
        userId: 3,
        review: 'Good spot, but needs improvement.',
        stars: 3,
      },
     
    ];

    await Review.bulkCreate(reviewData, { validate: true });
  },

  async down(queryInterface, Sequelize) {
    options.tableName = 'Reviews'; 
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
