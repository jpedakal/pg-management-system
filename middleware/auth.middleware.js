function requireAuth(req, res, next) {
  if (!req.session.userId) {
    req.session.returnTo = req.originalUrl;
    return res.redirect('/login');
  }

  return next();
}

function redirectIfAuthenticated(req, res, next) {
  if (req.session.userId) return res.redirect('/dashboard');
  return next();
}

function attachUser(req, res, next) {
  res.locals.currentUser = req.session.user || null;
  res.locals.currentPath = req.path;
  res.locals.flash = req.session.flash || null;
  delete req.session.flash;
  next();
}

function flash(req, type, message) {
  req.session.flash = { type, message };
}

module.exports = {
  requireAuth,
  redirectIfAuthenticated,
  attachUser,
  flash
};
