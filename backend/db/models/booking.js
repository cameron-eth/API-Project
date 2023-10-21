'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Booking extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // Define associations
      Booking.belongsTo(models.User, { foreignKey: 'userId' }); // A booking belongs to one user
      Booking.belongsTo(models.Spot, { foreignKey: 'spotId' }); // A booking belongs to one spot
    }
  }
  Booking.init({
    
    spotId: {
      type: DataTypes.INTEGER,
    },

    userId: {
      type: DataTypes.INTEGER,
    },

    startDate: {
      type: DataTypes.DATE,
    }, 
    endDate: {
      type: DataTypes.DATE
    },
  }, {
    sequelize,
    modelName: 'Booking',
  });
  return Booking;
};