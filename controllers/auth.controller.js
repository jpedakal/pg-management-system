const User = require('../models/User');
const { flash } = require('../middleware/auth.middleware');

exports.showLogin = (req, res) => {
  res.render('auth/login', { title: 'Login' });
};

exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email: (email || '').toLowerCase() });

    if (!user || !(await user.comparePassword(password || ''))) {
      flash(req, 'danger', 'Invalid email or password.');
      return res.redirect('/login');
    }

    if (user.status !== 'ACTIVE') {
      flash(req, 'danger', 'This account is inactive. Contact the owner.');
      return res.redirect('/login');
    }

    const ownerId = (user.accountOwnerId || user._id).toString();
    req.session.userId = user._id.toString();
    req.session.ownerId = ownerId;
    req.session.user = {
      id: user._id.toString(),
      ownerId,
      name: user.name,
      email: user.email,
      role: user.role,
      canManageUsers: ownerId === user._id.toString()
    };
    const returnTo = req.session.returnTo || '/dashboard';
    delete req.session.returnTo;
    return res.redirect(returnTo);
  } catch (error) {
    return next(error);
  }
};

exports.logout = (req, res, next) => {
  req.session.destroy((error) => {
    if (error) return next(error);
    res.clearCookie('connect.sid');
    return res.redirect('/login');
  });
};
