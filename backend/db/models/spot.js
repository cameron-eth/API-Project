'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Spot extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      Spot.belongsTo(models.User, { foreignKey: 'ownerId' }); // A spot belongs to one user
      Spot.hasMany(models.Booking, { foreignKey: 'spotId' }); // A spot has one booking
      Spot.hasMany(models.Review, {foreignKey: 'spotId'})
      Spot.hasMany(models.SpotImage, {foreignKey: 'spotId'})
    }
  }
  Spot.init({
    ownerId:{
      type:DataTypes.INTEGER,
    }, 
    address: {
      type: DataTypes.STRING,
    } ,

    city: {
      type: DataTypes.STRING,
    },

    state: {
      type: DataTypes.STRING,
    },

    country: {
      type: DataTypes.STRING,
    },

    lat: {
      type: DataTypes.FLOAT,
    },
    lng: {
      type: DataTypes.FLOAT,
    } ,
    name: {
      type: DataTypes.STRING,
    },
    description: {
      type: DataTypes.STRING,
    },
    price: {
      type: DataTypes.FLOAT
    }
  }, {
    sequelize,
    modelName: 'Spot',
  });
  return Spot;
};