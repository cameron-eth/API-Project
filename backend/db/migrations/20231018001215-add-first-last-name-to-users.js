'use strict';

let options = {};
if (process.env.NODE_ENV === 'production') {
  options.schema = process.env.SCHEMA; // Define your schema in options object
}

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('Users', 'first_name', {
      type: Sequelize.STRING(255), // You can adjust the length as needed
      allowNull: true
    }, options);

    await queryInterface.addColumn('Users', 'last_name', {
      type: Sequelize.STRING(255), // You can adjust the length as needed
      allowNull: true
    }, options);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('Users', 'first_name', options);
    await queryInterface.removeColumn('Users', 'last_name', options);
  }
};
