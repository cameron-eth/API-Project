const { setTokenCookie } = require('../../utils/auth.js');
const { User } = require('../../db/models');
const { restoreUser } = require('../../utils/auth.js');


const router = require('express').Router();
const sessionRouter = require('./session.js');
const usersRouter = require('./users.js');
const bookingsRouter = require('./bookings.js')
const reviewRouter = require('./reviews.js')
const spotsRouter = require('./spots.js', './spot_images.js' )
const spotsImageRouter = require('./spot_images.js')
const reviewImageRouter = require('./review_images.js')


router.use(restoreUser);
router.use('/session', sessionRouter);
router.use('/users', usersRouter);
router.use('/bookings', bookingsRouter)
router.use('/reviews', reviewRouter)
router.use('/spots', spotsRouter)
router.use('/spot-images', spotsImageRouter)
router.use('/review-images', reviewImageRouter)







router.post('/test', (req, res) => {
  res.json({ requestBody: req.body });
});

router.post('/test', function(req, res) {
    res.json({ requestBody: req.body });
    
}); //Needed twice ?



// GET /api/set-token-cookie
router.get('/set-token-cookie', async (_req, res) => {
  const user = await User.findOne({
    where: {
      username: 'Demo-lition'
    }
  });
  setTokenCookie(res, user);
  return res.json({ user: user });
});



// GET /api/restore-user
router.get(
  '/restore-user',
  (req, res) => {
    return res.json(req.user);
  }
);



router.use(restoreUser); //Needed twice ?
// GET /api/require-auth
const { requireAuth } = require('../../utils/auth.js'); //Needed twice ? Can this be up top?

router.get(
  '/require-auth',
  requireAuth,
  (req, res) => {
    return res.json(req.user);
  }
);







module.exports = router;