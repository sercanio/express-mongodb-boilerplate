"use strict";
const express = require("express");
const httpErrors = require("http-errors");
const pino = require("pino");
const pinoHttp = require("pino-http");
const mongoose = require("mongoose");
const setupMiddlewares = require('./utils/setupMiddlewares');
const startServer = require("./utils/startServer");
const validateEnvironmentVariables = require('./utils/validateEnvrionmentVariables');
require("dotenv").config();

module.exports = function main(options, cb) {
  const app = express();
  const logger = pino();
  const opts = Object.assign(
    {
      NODE_ENV: process.env.NODE_ENV,
      SECRET_KEY: process.env.SECRET_KEY,
      MONGODB_URI: process.env.MONGODB_URI,
      DB_CONNECTION_TIMEOUT: process.env.DB_CONNECTION_TIMEOUT,
      SESSION_COOKIE_MAXAGE: +process.env.SESSION_COOKIE_MAXAGE,
    },
    options,
  );

  validateEnvironmentVariables(opts);

  logger.info(`Environment : ${opts.NODE_ENV}`);

  async function connectDbWithRetry() {
    try {
      logger.info("Connecting to the MongoDB");
      await mongoose.connect(opts.MONGODB_URI);
      logger.info("Connected to MongoDB");

      setupMiddlewares(app, logger, opts, cb);
      startServer(app, logger, opts);

    } catch (err) {
      logger.error(`MongoDB connection error: ${err.message}`);
      logger.info(`Retrying connection in ${opts.DB_CONNECTION_TIMEOUT} seconds...`);
      setTimeout(connectDbWithRetry, 5000);
    }
  };
  connectDbWithRetry();
}
