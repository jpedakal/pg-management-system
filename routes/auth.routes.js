const express = require('express');
const authController = require('../controllers/auth.controller');
const { redirectIfAuthenticated } = require('../middleware/auth.middleware');
const { requireDatabase } = require('../middleware/database.middleware');

const router = express.Router();

router.get('/register', redirectIfAuthenticated, authController.showRegister);
router.post('/register', redirectIfAuthenticated, requireDatabase, authController.register);
router.get('/login', redirectIfAuthenticated, authController.showLogin);
router.post('/login', redirectIfAuthenticated, requireDatabase, authController.login);
router.post('/logout', authController.logout);

module.exports = router;
