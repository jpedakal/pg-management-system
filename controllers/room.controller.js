const Floor = require('../models/Floor');
const Room = require('../models/Room');
const Bed = require('../models/Bed');
const { getOwnerPG } = require('./dashboard.controller');
const { flash } = require('../middleware/auth.middleware');

async function createBedsForRoom(pgId, roomId, from, to) {
  const beds = [];
  for (let bedNumber = from; bedNumber <= to; bedNumber += 1) {
    beds.push({ pgId, roomId, bedNumber, status: 'AVAILABLE' });
  }
  if (beds.length) await Bed.insertMany(beds);
}

exports.index = async (req, res, next) => {
  try {
    const pg = await getOwnerPG(req.session.ownerId || req.session.userId);
    if (!pg) return res.redirect('/dashboard');

    const [floors, rooms] = await Promise.all([
      Floor.find({ pgId: pg._id }).sort({ floorNumber: 1 }).lean(),
      Room.find({ pgId: pg._id }).populate('floorId').sort({ roomNumber: 1 }).lean()
    ]);

    const bedCounts = await Bed.aggregate([
      { $match: { pgId: pg._id } },
      {
        $group: {
          _id: '$roomId',
          total: { $sum: 1 },
          occupied: { $sum: { $cond: [{ $eq: ['$status', 'OCCUPIED'] }, 1, 0] } }
        }
      }
    ]);

    const countsByRoom = bedCounts.reduce((map, item) => {
      map[item._id.toString()] = item;
      return map;
    }, {});

    return res.render('rooms/index', { title: 'Rooms', pg, floors, rooms, countsByRoom });
  } catch (error) {
    return next(error);
  }
};

exports.create = async (req, res, next) => {
  try {
    const pg = await getOwnerPG(req.session.ownerId || req.session.userId);
    if (!pg) return res.redirect('/dashboard');

    const { floorId, roomNumber, sharingType, monthlyRent } = req.body;
    const floor = await Floor.findOne({ _id: floorId, pgId: pg._id });
    if (!floor) {
      flash(req, 'danger', 'Selected floor is invalid.');
      return res.redirect('/rooms');
    }

    const capacity = Number(sharingType);
    if (!Number.isInteger(capacity) || capacity < 1) {
      flash(req, 'danger', 'Sharing type must be a positive whole number.');
      return res.redirect('/rooms');
    }

    const room = await Room.create({
      pgId: pg._id,
      floorId: floor._id,
      roomNumber,
      sharingType: capacity,
      monthlyRent
    });
    await createBedsForRoom(pg._id, room._id, 1, capacity);
    flash(req, 'success', 'Room added and beds created automatically.');
    return res.redirect('/rooms');
  } catch (error) {
    if (error.code === 11000) flash(req, 'danger', 'Room number must be unique within a floor.');
    else flash(req, 'danger', 'Unable to add room.');
    return res.redirect('/rooms');
  }
};

exports.update = async (req, res, next) => {
  try {
    const pg = await getOwnerPG(req.session.ownerId || req.session.userId);
    if (!pg) return res.redirect('/dashboard');

    const { floorId, roomNumber, sharingType, monthlyRent } = req.body;
    const [room, floor] = await Promise.all([
      Room.findOne({ _id: req.params.id, pgId: pg._id }),
      Floor.findOne({ _id: floorId, pgId: pg._id })
    ]);

    if (!room || !floor) {
      flash(req, 'danger', 'Room or floor not found.');
      return res.redirect('/rooms');
    }

    const capacity = Number(sharingType);
    if (!Number.isInteger(capacity) || capacity < 1) {
      flash(req, 'danger', 'Sharing type must be a positive whole number.');
      return res.redirect('/rooms');
    }

    const occupiedBeyondCapacity = await Bed.countDocuments({
      roomId: room._id,
      bedNumber: { $gt: capacity },
      status: 'OCCUPIED'
    });

    if (occupiedBeyondCapacity > 0) {
      flash(req, 'danger', 'Cannot reduce sharing because higher-numbered beds are occupied.');
      return res.redirect('/rooms');
    }

    const currentBedCount = await Bed.countDocuments({ roomId: room._id });
    if (capacity > currentBedCount) {
      await createBedsForRoom(pg._id, room._id, currentBedCount + 1, capacity);
    } else if (capacity < currentBedCount) {
      await Bed.deleteMany({
        roomId: room._id,
        bedNumber: { $gt: capacity },
        status: 'AVAILABLE'
      });
    }

    room.floorId = floor._id;
    room.roomNumber = roomNumber;
    room.sharingType = capacity;
    room.monthlyRent = monthlyRent;
    await room.save();

    flash(req, 'success', 'Room updated.');
    return res.redirect('/rooms');
  } catch (error) {
    if (error.code === 11000) flash(req, 'danger', 'Room number must be unique within a floor.');
    else flash(req, 'danger', 'Unable to update room.');
    return res.redirect('/rooms');
  }
};

exports.remove = async (req, res, next) => {
  try {
    const pg = await getOwnerPG(req.session.ownerId || req.session.userId);
    if (!pg) return res.redirect('/dashboard');

    const room = await Room.findOne({ _id: req.params.id, pgId: pg._id });
    if (!room) {
      flash(req, 'danger', 'Room not found.');
      return res.redirect('/rooms');
    }

    const occupiedBeds = await Bed.countDocuments({ roomId: room._id, status: 'OCCUPIED' });
    if (occupiedBeds > 0) {
      flash(req, 'danger', 'Cannot delete a room that has occupied beds.');
      return res.redirect('/rooms');
    }

    await Bed.deleteMany({ roomId: room._id });
    await room.deleteOne();
    flash(req, 'success', 'Room deleted.');
    return res.redirect('/rooms');
  } catch (error) {
    return next(error);
  }
};

exports.byFloor = async (req, res, next) => {
  try {
    const pg = await getOwnerPG(req.session.ownerId || req.session.userId);
    if (!pg) return res.status(404).json([]);

    const rooms = await Room.find({ pgId: pg._id, floorId: req.params.floorId })
      .sort({ roomNumber: 1 })
      .lean();
    return res.json(rooms);
  } catch (error) {
    return next(error);
  }
};

exports.availableBeds = async (req, res, next) => {
  try {
    const pg = await getOwnerPG(req.session.ownerId || req.session.userId);
    if (!pg) return res.status(404).json([]);

    const room = await Room.findOne({ _id: req.params.roomId, pgId: pg._id });
    if (!room) return res.status(404).json([]);

    const beds = await Bed.find({ roomId: room._id, status: 'AVAILABLE' }).sort({ bedNumber: 1 }).lean();
    return res.json(beds);
  } catch (error) {
    return next(error);
  }
};
