const mongoose = require('mongoose');

function getDatabaseStatus() {
  return {
    configured: Boolean(process.env.MONGODB_URI),
    connected: mongoose.connection.readyState === 1
  };
}

function attachDatabaseStatus(req, res, next) {
  res.locals.databaseStatus = getDatabaseStatus();
  next();
}

function requireDatabase(req, res, next) {
  const status = getDatabaseStatus();

  if (!status.configured) {
    return res.status(503).render('error', {
      title: 'MongoDB Not Configured',
      message:
        'Create a .env file with MONGODB_URI, SESSION_SECRET, and PORT, then restart the server.'
    });
  }

  if (!status.connected) {
    return res.status(503).render('error', {
      title: 'MongoDB Not Connected',
      message: 'The app is running, but MongoDB is not connected yet. Check your MONGODB_URI and restart the server.'
    });
  }

  return next();
}

module.exports = {
  attachDatabaseStatus,
  requireDatabase
};
