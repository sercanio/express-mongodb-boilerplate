const User = require('../models/User'); // Adjust the path accordingly
const bcrypt = require('bcrypt');
const AppError = require('../utils/errors');
const passport = require('passport');

exports.registerUser = async (req, res, next) => {
  try {
    const { username, email, password } = req.body;
    const hashedPassword = await bcrypt.hash(password, 12);

    const user = new User({
      username,
      email,
      password: hashedPassword,
    });

    await user.save();
    res.redirect('/login')
  } catch (error) {
    console.error(error);
    if (error.code === 11000) {
      res.render('register', { error: new AppError('Username or email is already taken', 400) });
    } else {
      res.render('register', { error: new AppError('Internal server error', 500) });
    }
  }
};

exports.logoutUser = (req, res) => {
  try {
    req.logout((err) => {
      res.redirect('/');
    });
  } catch (error) {
    console.error(error);
  }
};
