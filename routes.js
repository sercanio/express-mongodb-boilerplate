'use strict';
const authController = require('./controllers/authController');
const passport = require('passport');
const middleware = require('./middlewares/authMiddleware');

module.exports = function (app, opts) {
  app.get('/', (req, res) => {
    res.render('index');
  });

  app.get("/profile", middleware.protectRoute, (req, res) => {
    res.render("profile")
  })

  app
    .route('/login')
    .get((req, res) => {
      res.render('login', { error: req.flash('error') }); // Pass the flash message to the login view
    })
    .post(passport.authenticate('local', {
      successRedirect: '/',
      failureRedirect: '/login',
      failureFlash: true,
    }));

  app
    .route('/register')
    .get((req, res) => {
      res.render('register');
    })
    .post(authController.registerUser);

  app.get('/logout', authController.logoutUser);
};
