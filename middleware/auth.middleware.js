function requireAuth(req, res, next) {
  if (!req.session.userId) {
    req.session.returnTo = req.originalUrl;
    return res.redirect('/login');
  }

  if (!req.session.ownerId) req.session.ownerId = req.session.userId;
  return next();
}

function requireOwnerAdmin(req, res, next) {
  if (!req.session.userId) {
    req.session.returnTo = req.originalUrl;
    return res.redirect('/login');
  }

  if (!req.session.ownerId) req.session.ownerId = req.session.userId;
  if (req.session.ownerId !== req.session.userId) {
    flash(req, 'danger', 'Only the owner can manage users.');
    return res.redirect('/dashboard');
  }

  return next();
}

function redirectIfAuthenticated(req, res, next) {
  if (req.session.userId) return res.redirect('/dashboard');
  return next();
}

function attachUser(req, res, next) {
  if (req.session.userId && !req.session.ownerId) req.session.ownerId = req.session.userId;
  res.locals.currentUser = req.session.user
    ? {
        ...req.session.user,
        ownerId: req.session.ownerId,
        canManageUsers: req.session.ownerId === req.session.userId
      }
    : null;
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
  requireOwnerAdmin,
  redirectIfAuthenticated,
  attachUser,
  flash
};
