const express = require('express');
const floorController = require('../controllers/floor.controller');
const { requireAuth } = require('../middleware/auth.middleware');
const { requireDatabase } = require('../middleware/database.middleware');

const router = express.Router();

router.get('/', requireAuth, requireDatabase, floorController.index);
router.post('/', requireAuth, requireDatabase, floorController.create);
router.put('/:id', requireAuth, requireDatabase, floorController.update);
router.delete('/:id', requireAuth, requireDatabase, floorController.remove);

module.exports = router;
