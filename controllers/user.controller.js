const User = require('../models/User');
const { flash } = require('../middleware/auth.middleware');

exports.index = async (req, res, next) => {
  try {
    const ownerId = req.session.ownerId || req.session.userId;
    const users = await User.find({
      $or: [{ _id: ownerId }, { accountOwnerId: ownerId }]
    })
      .sort({ accountOwnerId: 1, createdAt: 1 })
      .lean();

    return res.render('users/index', {
      title: 'Users',
      users
    });
  } catch (error) {
    return next(error);
  }
};

exports.create = async (req, res, next) => {
  try {
    const ownerId = req.session.ownerId || req.session.userId;
    const { name, email, password, confirmPassword } = req.body;

    if (!name || !email || !password) {
      flash(req, 'danger', 'Please complete all required fields.');
      return res.redirect('/users');
    }

    if (password !== confirmPassword) {
      flash(req, 'danger', 'Passwords do not match.');
      return res.redirect('/users');
    }

    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      flash(req, 'danger', 'A user already exists for this email.');
      return res.redirect('/users');
    }

    await User.create({
      name,
      email,
      password,
      role: 'STAFF',
      accountOwnerId: ownerId
    });

    flash(req, 'success', `User created. Share these login credentials with ${email}.`);
    return res.redirect('/users');
  } catch (error) {
    return next(error);
  }
};
