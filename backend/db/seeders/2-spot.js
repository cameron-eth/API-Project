'use strict';

const { Spot } = require('../models');
const bcrypt = require('bcryptjs');

let options = {};
if (process.env.NODE_ENV === 'production') {
  options.schema = process.env.SCHEMA;
  options.tableName = 'Spots'; // Define the table name in the options object
}

module.exports = {
  async up(queryInterface, Sequelize) {
    const spotData = [
      {
        ownerId: 1,
        address: '111 Jefferson St',
        city: 'Modesto',
        state: 'CA',
        country: 'USA',
        lat: 21.0522,
        lng: -144.7537,
        name: 'Cozy Cabin',
        description: 'A-frame cabin in the heart of the forest.',
        price: 234,
      },
      {
        ownerId: 2,
        address: '436 West St',
        city: 'Oakland',
        state: 'CA',
        country: 'USA',
        lat: 33.7128,
        lng: -44.0060,
        name: 'Urban Loft',
        description: 'A modern apartment with a view.',
        price: 178,
      },
      {
        ownerId: 3,
        address: '749 Main St',
        city: 'Marin',
        state: 'CA',
        country: 'USA',
        lat: 21.7504,
        lng: -92.3398,
        name: 'Lakeside Retreat',
        description: 'Single Family cabin in the woods',
        price: 187,
      },
    ];

    await Spot.bulkCreate(spotData, { validate: true, individualHooks: true });
  },

  async down(queryInterface, Sequelize) {
    const Op = Sequelize.Op;

    const ownerIdsToDelete = [1, 2, 3];
    const conditions = {
      ownerId: {
        [Op.in]: ownerIdsToDelete,
      },
    };

    return queryInterface.bulkDelete(options, conditions, {});
  },
};
