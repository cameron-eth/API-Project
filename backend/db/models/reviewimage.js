'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class ReviewImage extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      ReviewImage.belongsTo(models.Review, { foreignKey: 'reviewId' }); // A review image belongs to a review
    }
  }
  ReviewImage.init({
    reviewId: {
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
    modelName: 'ReviewImage',
  });
  return ReviewImage;
};