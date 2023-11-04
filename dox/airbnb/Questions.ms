Mostly Sure:
- Get All Bookings for a Spot By Id Owner vs User -> should be correct might need logic switch


ROUTES:
- spots dataType (most likely)
- add image to review Id increment
- minLat Params




// router.get('/', async (req, res) => {
//   // Extract query parameters from the request with default values
//   const { page = 1, size = 20, minLat, maxLat, minLng, maxLng, minPrice, maxPrice } = req.query;

//   // Validate query parameters
//   const errors = {};

//   if (isNaN(page) || page < 1 || page > 10) {
//     errors.page = 'Page must be between 1 and 10';
//   }

//   if (isNaN(size) || size < 1 || size > 20) {
//     errors.size = 'Size must be between 1 and 20';
//   }

//   if (minLat && (isNaN(minLat) || minLat < -90 || minLat > 90)) {
//     errors.minLat = 'Minimum latitude is invalid';
//   }

//   if (maxLat && (isNaN(maxLat) || maxLat < -90 || maxLat > 90)) {
//     errors.maxLat = 'Maximum latitude is invalid';
//   }

//   if (minLng && (isNaN(minLng) || minLng < -180 || minLng > 180)) {
//     errors.minLng = 'Minimum longitude is invalid';
//   }

//   if (maxLng && (isNaN(maxLng) || maxLng < -180 || maxLng > 180)) {
//     errors.maxLng = 'Maximum longitude is invalid';
//   }

//   if (minPrice && (isNaN(minPrice) || minPrice < 0)) {
//     errors.minPrice = 'Minimum price must be greater than or equal to 0';
//   }

//   if (maxPrice && (isNaN(maxPrice) || maxPrice < 0)) {
//     errors.maxPrice = 'Maximum price must be greater than or equal to 0';
//   }

//   if (Object.keys(errors).length > 0) {
//     return res.status(400).json({
//       message: 'Bad Request',
//       errors,
//     });
//   }

//   // Define the query to filter spots based on the query parameters
//   const spotQuery = {
//     attributes: [
//       'id',
//       'ownerId',
//       'address',
//       'city',
//       'state',
//       'country',
//       'lat',
//       'lng',
//       'name',
//       'description',
//       'price',
//       'createdAt',
//       'updatedAt',
//       [
//         Sequelize.fn('COALESCE', Sequelize.literal(`ROUND(AVG("Reviews"."stars"), 1)`), null),
//         'avgRating',
//       ],
//       [
//         Sequelize.literal(`
//           (SELECT "url" FROM "SpotImages"
//           WHERE "spotId" = "Spot"."id"
//           AND "preview" = true
//           LIMIT 1)
//         `),
//         'previewImage',
//       ],
//     ],
//     include: [
//       {
//         model: Review,
//         as: 'Reviews',
//         attributes: [],
//       },
//     ],
//     raw: true,
//     nest: true,
//     subQuery: false,
//     group: ['Spot.id'],
//     includeIgnoreAttributes: false,
//     order: [['id', 'ASC']],
//   };

//   // Initialize the 'where' object as an empty object
//   spotQuery.where = {};

//   // Apply additional filters based on query parameters
//   if (minLat && maxLat && minLng && maxLng) {
//     spotQuery.where.lat = { [Sequelize.Op.between]: [minLat, maxLat] };
//     spotQuery.where.lng = { [Sequelize.Op.between]: [minLng, maxLng] };
//   }

//   if (minPrice && maxPrice) {
//     spotQuery.where.price = { [Sequelize.Op.between]: [minPrice, maxPrice] };
//   }

//   // Pagination
//   const offset = (page - 1) * size;

//   try {
//     const spots = await Spot.findAll({
//       ...spotQuery,
//       offset,
//     });

//     res.status(200).json({ Spots: spots, page: Number(page), size: Number(size) });
//   } catch (err) {
//     console.error(err);
//     res.status(500).json({ message: 'Internal Server Error' });
//   }
// });




// router.get('/', async (req, res) => {
//   const schemaName = 'production10_db';

//   const { page = 1, size = 20, minLat, maxLat, minLng, maxLng, minPrice, maxPrice } = req.query;

//   const errors = {};

//   if (isNaN(page) || page < 1 || page > 10) {
//     errors.page = 'Page must be between 1 and 10';
//   }

//   if (isNaN(size) || size < 1 || size > 20) {
//     errors.size = 'Size must be between 1 and 20';
//   }

//   if (minLat && (isNaN(minLat) || minLat < -90 || minLat > 90)) {
//     errors.minLat = 'Minimum latitude is invalid';
//   }

//   if (maxLat && (isNaN(maxLat) || maxLat < -90 || maxLat > 90)) {
//     errors.maxLat = 'Maximum latitude is invalid';
//   }

//   if (minLng && (isNaN(minLng) || minLng < -180 || minLng > 180)) {
//     errors.minLng = 'Minimum longitude is invalid';
//   }

//   if (maxLng && (isNaN(maxLng) || maxLng < -180 || maxLng > 180)) {
//     errors.maxLng = 'Maximum longitude is invalid';
//   }

//   if (minPrice && (isNaN(minPrice) || minPrice < 0)) {
//     errors.minPrice = 'Minimum price must be greater than or equal to 0';
//   }

//   if (maxPrice && (isNaN(maxPrice) || maxPrice < 0)) {
//     errors.maxPrice = 'Maximum price must be greater than or equal to 0';
//   }

//   if (Object.keys(errors).length > 0) {
//     return res.status(400).json({
//       message: 'Bad Request',
//       errors,
//     });
//   }

//   const spotQuery = {
//     attributes: [
//       'id',
//       'ownerId',
//       'address',
//       'city',
//       'state',
//       'country',
//       'lat',
//       'lng',
//       'name',
//       'description',
//       'price',
//       'createdAt',
//       'updatedAt',
//       [
//         Sequelize.fn('COALESCE', Sequelize.literal(`ROUND(AVG("Reviews"."stars"), 1)`), null),
//         'avgRating',
//       ],
//       [
//         Sequelize.literal(`
//           (SELECT "url" FROM "${schemaName}"."SpotImages"
//           WHERE "spotId" = "${schemaName}"."Spot"."id"
//           AND "preview" = true
//           LIMIT 1)
//         `),
//         'previewImage',
//       ],
//     ],
//     include: [
//       {
//         model: Review,
//         as: 'Reviews',
//         attributes: [],
//       },
//     ],
//     raw: true,
//     nest: true,
//     subQuery: false,
//     group: ['Spot.id'],
//     includeIgnoreAttributes: false,
//     order: [['id', 'ASC']],
//   };

//   spotQuery.where = {};

//   if (minLat && maxLat && minLng && maxLng) {
//     spotQuery.where.lat = { [Sequelize.Op.between]: [minLat, maxLat] };
//     spotQuery.where.lng = { [Sequelize.Op.between]: [minLng, maxLng] };
//   }

//   if (minPrice && maxPrice) {
//     spotQuery.where.price = { [Sequelize.Op.between]: [minPrice, maxPrice] };
//   }

//   const offset = (page - 1) * size;

//   try {
//     const spots = await Spot.findAll({
//       ...spotQuery,
//       offset,
//     });

//     res.status(200).json({ Spots: spots, page: Number(page), size: Number(size) });
//   } catch (err) {
//     console.error(err);
//     res.status(500).json({ message: 'Internal Server Error' });
//   }
// });




