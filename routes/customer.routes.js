const express = require('express');
const customerController = require('../controllers/customer.controller');
const { requireAuth } = require('../middleware/auth.middleware');
const { requireDatabase } = require('../middleware/database.middleware');

const router = express.Router();

router.get('/', requireAuth, requireDatabase, customerController.index);
router.get('/new', requireAuth, requireDatabase, customerController.new);
router.post('/', requireAuth, requireDatabase, customerController.create);
router.get('/:id', requireAuth, requireDatabase, customerController.show);
router.post('/:id/vacate', requireAuth, requireDatabase, customerController.vacate);

module.exports = router;
