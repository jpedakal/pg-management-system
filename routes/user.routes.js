const express = require('express');
const userController = require('../controllers/user.controller');
const { requireOwnerAdmin } = require('../middleware/auth.middleware');
const { requireDatabase } = require('../middleware/database.middleware');

const router = express.Router();

router.get('/', requireOwnerAdmin, requireDatabase, userController.index);
router.post('/', requireOwnerAdmin, requireDatabase, userController.create);

module.exports = router;
