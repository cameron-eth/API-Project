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
      Spot.belongsTo(models.User, { as: 'Owner', foreignKey: 'ownerId' }); 
      Spot.hasMany(models.Booking, { foreignKey: 'spotId', onDelete: 'CASCADE' });
      Spot.hasMany(models.Review, { foreignKey: 'spotId', onDelete: 'CASCADE', as: 'Reviews'});
      Spot.hasMany(models.SpotImage, {foreignKey: 'spotId',  onDelete: 'CASCADE'})
    }
  }
  Spot.init({
    ownerId:{
      type:DataTypes.INTEGER,
    }, 
    address: {
      type: DataTypes.TEXT,
    } ,

    city: {
      type: DataTypes.TEXT,
    },

    state: {
      type: DataTypes.TEXT,
    },

    country: {
      type: DataTypes.TEXT,
    },

    lat: {
      type: DataTypes.FLOAT,
    },
    lng: {
      type: DataTypes.FLOAT,
    } ,
    name: {
      type: DataTypes.TEXT,
    },
    description: {
      type: DataTypes.TEXT,
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