'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Review extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // Define associations
      Review.belongsTo(models.User, { foreignKey: 'userId'}); // A review belongs to a user
      Review.belongsTo(models.Spot, { foreignKey: 'spotId' }); // A review belongs to a spot
      Review.hasMany(models.ReviewImage, { foreignKey: 'reviewId',  onDelete: 'CASCADE', hooks: true});
    }
  }
  Review.init({
    spotId: {
      type: DataTypes.INTEGER,
    },
    userId: {
      type: DataTypes.INTEGER,
    },
    review: {
      type: DataTypes.STRING,
    },
    stars: {
      type: DataTypes.INTEGER
    } 
  }, {
    sequelize,
    modelName: 'Review',
    hooks: true
  });
  return Review;
};