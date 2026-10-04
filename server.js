require('dotenv').config();

const express = require('express');
const path = require('path');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const methodOverride = require('method-override');
const connectDatabase = require('./config/database');
const { attachUser } = require('./middleware/auth.middleware');
const { attachDatabaseStatus } = require('./middleware/database.middleware');

const authRoutes = require('./routes/auth.routes');
const dashboardRoutes = require('./routes/dashboard.routes');
const floorRoutes = require('./routes/floor.routes');
const roomRoutes = require('./routes/room.routes');
const customerRoutes = require('./routes/customer.routes');

const app = express();
const PORT = process.env.PORT || 3000;

connectDatabase();

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(methodOverride('_method'));
app.use(express.static(path.join(__dirname, 'public')));

app.use(
  session({
    secret: process.env.SESSION_SECRET || 'dev-secret-change-me',
    resave: false,
    saveUninitialized: false,
    store: process.env.MONGODB_URI
      ? MongoStore.create({ mongoUrl: process.env.MONGODB_URI })
      : undefined,
    cookie: {
      httpOnly: true,
      maxAge: 1000 * 60 * 60 * 24
    }
  })
);

app.use(attachUser);
app.use(attachDatabaseStatus);

app.use('/', authRoutes);
app.use('/dashboard', dashboardRoutes);
app.use('/floors', floorRoutes);
app.use('/rooms', roomRoutes);
app.use('/customers', customerRoutes);

app.get('/', (req, res) => {
  if (req.session.userId) return res.redirect('/dashboard');
  return res.redirect('/login');
});

app.use((req, res) => {
  res.status(404).render('error', {
    title: 'Not Found',
    message: 'The page you requested could not be found.'
  });
});

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).render('error', {
    title: 'Server Error',
    message: 'Something went wrong. Please try again.'
  });
});

app.listen(PORT, () => {
  console.log(`PG Management System running on http://localhost:${PORT}`);
});
