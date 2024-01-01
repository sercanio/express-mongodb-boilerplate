function startServer(app, logger, opts, cb) {
  const ready = cb || function () { };

  // Server state
  let server;
  let serverStarted = false;
  let serverClosing = false;

  server = app.listen(opts.port, opts.host, (err) => {
    if (err) {
      return ready(err, app, server);
    }

    // If some other error means we should close
    if (serverClosing) {
      return ready(new Error("Server was closed before it could start"));
    }

    serverStarted = true;
    const addr = server.address();
    logger.info(
      `Server started at ${opts.host || addr.host || "localhost"}:${addr.port}`,
    );
    ready(err, app, server);
  });
}

module.exports = startServer;