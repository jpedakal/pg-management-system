const express = require('express');
const roomController = require('../controllers/room.controller');
const { requireAuth } = require('../middleware/auth.middleware');
const { requireDatabase } = require('../middleware/database.middleware');

const router = express.Router();

router.get('/', requireAuth, requireDatabase, roomController.index);
router.post('/', requireAuth, requireDatabase, roomController.create);
router.put('/:id', requireAuth, requireDatabase, roomController.update);
router.delete('/:id', requireAuth, requireDatabase, roomController.remove);
router.get('/api/by-floor/:floorId', requireAuth, requireDatabase, roomController.byFloor);
router.get('/api/:roomId/available-beds', requireAuth, requireDatabase, roomController.availableBeds);

module.exports = router;
