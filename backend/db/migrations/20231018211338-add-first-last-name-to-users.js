'use strict';

let options = {};
if (process.env.NODE_ENV === 'production') {
  options.schema = process.env.SCHEMA; // Define your schema in options object
  
}

module.exports = {
  async up(queryInterface, Sequelize) {
    options.tableName = 'Users';
    await queryInterface.addColumn(options, 'first_name', {
      type: Sequelize.STRING(255), // You can adjust the length as needed
      allowNull: false
    }, options);

    await queryInterface.addColumn(options, 'last_name', {
      type: Sequelize.STRING(255), // You can adjust the length as needed
      allowNull: false
    });
  },

  async down(queryInterface, Sequelize) {
    options.tableName = 'Users';
    await queryInterface.removeColumn(options, 'first_name');
    await queryInterface.removeColumn(options, 'last_name');
  }
};
