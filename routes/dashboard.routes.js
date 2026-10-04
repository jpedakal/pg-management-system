const express = require('express');
const dashboardController = require('../controllers/dashboard.controller');
const { requireAuth } = require('../middleware/auth.middleware');
const { requireDatabase } = require('../middleware/database.middleware');

const router = express.Router();

router.get('/', requireAuth, requireDatabase, dashboardController.index);
router.post('/pg', requireAuth, requireDatabase, dashboardController.createPG);

module.exports = router;
