'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class SpotImage extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      SpotImage.belongsTo(models.Spot, { foreignKey: 'spotId' }); // A spot image belongs to a spot
    }
  }
  SpotImage.init({
    spotId: {
      type: DataTypes.INTEGER,
    }, 
    url: {
      type: DataTypes.STRING,
    },
    preview: {
      type: DataTypes.BOOLEAN
    } 
  }, {
    sequelize,
    modelName: 'SpotImage',
  });
  return SpotImage;
};