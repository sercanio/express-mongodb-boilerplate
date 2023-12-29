'use strict'
const express = require('express')
const httpErrors = require('http-errors')
const path = require('path')
const pug = require('pug')
const pino = require('pino')
const pinoHttp = require('pino-http')
const mongoose = require('mongoose');
const session = require('express-session');
const flash = require('connect-flash');
const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy
const bcrypt = require('bcrypt');
const bodyParser = require('body-parser');
const middleware = require('./middlewares/authMiddleware');
const AppError = require('./utils/errors')
const User = require('./models/User');
const MongoStore = require('connect-mongo');
require('dotenv').config();

module.exports = function main(options, cb) {
  // Set default options
  const ready = cb || function () { }
  const opts = Object.assign({
    // Default options
  }, options)

  const logger = pino()
  logger.info(`Environment : ${process.env.NODE_ENV}`);
  // Server state
  let server
  let serverStarted = false
  let serverClosing = false

  // Connect to MongoDB using Mongoose
  mongoose.connect(process.env.MONGODB_URI);

  const db = mongoose.connection;

  db.on('error', (err) => {
    logger.error(err);
    process.exit(1); // Exit the app on database connection error
  });

  db.once('open', () => {
    logger.info('Connected to MongoDB');
  });

  // Create the express app
  const app = express();

  // Template engine
  app.engine('pug', pug.renderFile);
  app.set('views', path.join(__dirname, 'views'));
  app.set('view engine', 'pug');

  app.use(pinoHttp({ logger }));
  app.use(bodyParser.json());
  app.use(express.urlencoded({ extended: false }))

  app.use(session({
    secret: process.env.SECRET_KEY, // Change this to a secure random string
    resave: false,
    saveUninitialized: true,
    store: MongoStore.create({ mongoUrl: process.env.MONGODB_URI }),
    cookie: {
      maxAge: +process.env.SESSION_COOKIE_MAXAGE,
      secure: false, // Set to true if your app is served over HTTPS
      httpOnly: true,
    },
  }));
  app.use(flash());
  // Passport Configuration
  app.use(passport.initialize());
  app.use(passport.session());

  const handleAuthentication = async (req, username, password, done) => {
    try {
      const user = await User.findOne({ username });

      if (!user) {
        req.flash('error', 'Incorrect username or password');
        return done(null, false);
      }

      const passwordMatch = await bcrypt.compare(password, user.password);

      if (!passwordMatch) {
        req.flash('error', 'Incorrect username or password');
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

  passport.use(new LocalStrategy({ usernameField: 'username', passwordField: 'password', passReqToCallback: true }, authUser));

  passport.serializeUser((userObj, done) => {
    done(null, userObj)
  })
  passport.deserializeUser((userObj, done) => {
    done(null, userObj)
  })
  app.use(middleware.sendAuthStatus)

  // Register routes
  require('./routes')(app, opts);

  // Common error handlers
  app.use((req, res, next) => {
    next(new AppError(`Page not found: ${req.url}`, 404));
  });

  app.use((err, req, res, next) => {
    res.locals.name = err.status;
    res.locals.error = err;
    res.status(err.status || 500).render('error');
  });
  // Start server only if the database connection is successful
  server = app.listen(opts.port, opts.host, (err) => {
    if (err) {
      return ready(err, app, server);
    }

    // If some other error means we should close
    if (serverClosing) {
      return ready(new Error('Server was closed before it could start'));
    }

    serverStarted = true;
    const addr = server.address();
    logger.info(`Server started at ${opts.host || addr.host || 'localhost'}:${addr.port}`);
    ready(err, app, server);
  });
};