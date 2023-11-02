'use strict';

const { Booking } = require('../models');

let options = {};
if (process.env.NODE_ENV === 'production') {
  options.schema = process.env.SCHEMA;
  options.tableName = 'Bookings'; // Define the table name in the options object
}

module.exports = {
  async up(queryInterface, Sequelize) {
    const bookingData = [
      {
        spotId: 1,
        userId: 1,
        startDate: new Date('2023-11-01'),
        endDate: new Date('2023-11-10'),
      },
      {
        spotId: 2,
        userId: 2,
        startDate: new Date('2023-11-05'),
        endDate: new Date('2023-11-15'),
      },
      {
        spotId: 1,
        userId: 3,
        startDate: new Date('2023-11-10'),
        endDate: new Date('2023-11-20'),
      },
    ];

    await Booking.bulkCreate(bookingData, { validate: true, individualHooks: true, ...options });
  },

  async down(queryInterface, Sequelize) {
    const Op = Sequelize.Op;

    const bookingIdsToDelete = [1, 2, 3];

    const conditions = {
      id: {
        [Op.in]: bookingIdsToDelete,
      },
    };

    return queryInterface.bulkDelete(options, conditions, {});
  },
};
