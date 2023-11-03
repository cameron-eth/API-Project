const express = require('express');
const bcrypt = require('bcryptjs');

const { setTokenCookie, requireAuth } = require('../../utils/auth');
const { User } = require('../../db/models');
const router = express.Router();

const { check } = require('express-validator');
const { handleValidationErrors } = require('../../utils/validation');

// Validation middleware for signup
const validateSignup = [
    check('email')
      .exists({ checkFalsy: true })
      .isEmail()
      .withMessage('Invalid email'),
    check('username')
      .exists({ checkFalsy: true })
      .isLength({ min: 4 })
      .withMessage('Username is required'),
    check('username')
      .not()
      .isEmail()
      .withMessage('Username cannot be an email.'),
    // check('password')
    //   .exists({ checkFalsy: true })
    //   .isLength({ min: 6 }),
    check('firstName')
      .optional() // The first name is optional, remove this line if it's required
      .isLength({ min: 2 })
      .withMessage('First Name is required.'),
    check('lastName')
      .optional() // The last name is optional, remove this line if it's required
      .isLength({ min: 2 })
      .withMessage('Last Name is required'),
    handleValidationErrors,
];
  

// User Signup Route
router.post(
    '/',
    validateSignup,
    async (req, res) => {
        const { email, password, username, firstName, lastName } = req.body;

        // Check if a user already exists with the provided email or username
        const existingUserEmail = await User.findOne({
            where: { email }
        });

        const existingUserUsername = await User.findOne({
            where: { username }
        });

        if (existingUserEmail) {
            return res.status(500).json({
                message: 'User already exists',
                errors: {
                    email: 'User with that email already exists'
                }
            });
        }

        if (existingUserUsername) {
            return res.status(500).json({
                message: 'User already exists',
                errors: {
                    username: 'User with that username already exists'
                }
            });
        }

        const hashedPassword = bcrypt.hashSync(password);
        const user = await User.create({ email, username, hashedPassword, firstName, lastName });

        const safeUser = {
            id: user.id,
            email: user.email,
            username: user.username,
            firstName: user.firstName,
            lastName: user.lastName
        };

        await setTokenCookie(res, safeUser);

        return res.status(200).json({
            user: safeUser
        });
    }
);

module.exports = router;
