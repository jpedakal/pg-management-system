const User = require('../models/User');
const { flash } = require('../middleware/auth.middleware');

exports.showRegister = (req, res) => {
  res.render('auth/register', { title: 'Register' });
};

exports.register = async (req, res, next) => {
  try {
    const { name, email, password, confirmPassword } = req.body;

    if (!name || !email || !password) {
      flash(req, 'danger', 'Please complete all required fields.');
      return res.redirect('/register');
    }

    if (password !== confirmPassword) {
      flash(req, 'danger', 'Passwords do not match.');
      return res.redirect('/register');
    }

    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      flash(req, 'danger', 'An account already exists for this email.');
      return res.redirect('/register');
    }

    const user = await User.create({ name, email, password });
    req.session.userId = user._id.toString();
    req.session.user = { id: user._id.toString(), name: user.name, email: user.email };
    return res.redirect('/dashboard');
  } catch (error) {
    return next(error);
  }
};

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

    req.session.userId = user._id.toString();
    req.session.user = { id: user._id.toString(), name: user.name, email: user.email };
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
