const passport = require("passport");
const LocalStrategy = require("passport-local").Strategy;
const bcrypt = require("bcrypt");
const User = require('../models/User')

// Whenever add a new strategy, implement middleware and call it setupPassportMiddlewares
function setupPassportMiddlewares(app) {
  setupPassportLocalMiddleware(app)
}
function setupPassportLocalMiddleware(app) {
  // Passport Configuration
  app.use(passport.initialize());
  app.use(passport.session());
  const handleAuthentication = async (req, username, password, done) => {
    try {
      const user = await User.findOne({ username });

      if (!user) {
        req.flash("error", "Incorrect username or password");
        return done(null, false);
      }

      const passwordMatch = await bcrypt.compare(password, user.password);

      if (!passwordMatch) {
        req.flash("error", "Incorrect username or password");
        return done(null, false);
      }

      return done(null, user);
    } catch (error) {
      return done(error);
    }
  };

  const authUser = async (req, username, password, done) => {
    try {
      await handleAuthentication(req, username, password, done);
    } catch (error) {
      return done(error);
    }
  };

  passport.use(
    new LocalStrategy(
      {
        usernameField: "username",
        passwordField: "password",
        passReqToCallback: true,
      },
      authUser,
    ),
  );

  passport.serializeUser((userObj, done) => {
    done(null, userObj);
  });

  passport.deserializeUser((userObj, done) => {
    done(null, userObj);
  });
}

module.exports = setupPassportMiddlewares;