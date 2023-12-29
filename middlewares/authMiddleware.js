function protectRoute(req, res, next) {
  if (req.isAuthenticated()) {
    return next();
  }
  res.redirect('/login');
};

function sendAuthStatus(req, res, next) {
  if (req.isAuthenticated()) {
    res.locals.authenticated = req.isAuthenticated();
    res.locals.user = req.user.username;
  }
  next();
}

module.exports = {
  protectRoute,
  sendAuthStatus,
};