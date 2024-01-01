const path = require("path");
const helmet = require("helmet");
const bodyParser = require("body-parser");
const pug = require("pug");
const pinoHttp = require("pino-http");
const express = require("express");
const session = require("express-session");
const MongoStore = require("connect-mongo");
const flash = require("connect-flash");
const AppError = require("./errors");
const setupPassportMiddlewares = require("./setupPassportMiddlewares");
const authMiddleware = require("../middlewares/authMiddleware");

function setupMiddlewares(app, logger, opts) {
  // Helmet
  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          "img-src": ["'self'", "*.unsplash.com", "*.w3.org"],
          "script-src": ["'self'", "cdn.jsdelivr.net"],
          "style-src": ["'self'", "cdn.jsdelivr.net"],
        },
      },
    }),
  );

  // Template engine
  app.engine("pug", pug.renderFile);
  app.set("views", path.join(__dirname, "../views"));
  app.set("view engine", "pug");

  app.use(pinoHttp({ logger }));
  app.use(bodyParser.json());
  app.use(express.urlencoded({ extended: false }));

  app.use(
    session({
      secret: opts.SECRET_KEY, // Change this to a secure random string
      resave: false,
      saveUninitialized: true,
      store: MongoStore.create({ mongoUrl: opts.MONGODB_URI }),
      cookie: {
        maxAge: opts.SESSION_COOKIE_MAXAGE,
        secure: opts.NODE_ENV === 'production', // Set to true if your app is served over HTTPS
        httpOnly: true,
      },
    }),
  );
  app.use(flash());
  setupPassportMiddlewares(app);
  app.use(authMiddleware.sendAuthStatus);

  // Register routes
  require("../routes")(app, opts);

  // Common error handlers
  app.use((req, res, next) => {
    next(new AppError(`Page not found: ${req.url}`, 404));
  });

  app.use((err, req, res, next) => {
    res.locals.name = err.status;
    res.locals.error = err;
    res.status(err.status || 500).render("error");
  });
}

module.exports = setupMiddlewares;
