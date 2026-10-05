const PG = require('../models/PG');
const Floor = require('../models/Floor');
const Room = require('../models/Room');
const Bed = require('../models/Bed');
const Customer = require('../models/Customer');
const { flash } = require('../middleware/auth.middleware');

async function getOwnerPG(ownerId) {
  return PG.findOne({ ownerId }).sort({ createdAt: 1 });
}

exports.getOwnerPG = getOwnerPG;

exports.index = async (req, res, next) => {
  try {
    const pg = await getOwnerPG(req.session.ownerId || req.session.userId);

    if (!pg) {
      return res.render('dashboard/setup', { title: 'Setup PG' });
    }

    const [totalFloors, totalRooms, totalBeds, occupiedBeds, activeTenants, floors, rooms, beds] =
      await Promise.all([
        Floor.countDocuments({ pgId: pg._id }),
        Room.countDocuments({ pgId: pg._id }),
        Bed.countDocuments({ pgId: pg._id }),
        Bed.countDocuments({ pgId: pg._id, status: 'OCCUPIED' }),
        Customer.countDocuments({ pgId: pg._id, status: 'ACTIVE' }),
        Floor.find({ pgId: pg._id }).sort({ floorNumber: 1 }).lean(),
        Room.find({ pgId: pg._id }).sort({ roomNumber: 1 }).lean(),
        Bed.find({ pgId: pg._id }).populate('currentCustomerId').lean()
      ]);

    const bedGroups = beds.reduce((groups, bed) => {
      const key = bed.roomId.toString();
      groups[key] = groups[key] || [];
      groups[key].push(bed);
      return groups;
    }, {});

    const roomsByFloor = floors.map((floor) => {
      const floorRooms = rooms
        .filter((room) => room.floorId.toString() === floor._id.toString())
        .map((room) => {
          const roomBeds = (bedGroups[room._id.toString()] || []).sort(
            (a, b) => a.bedNumber - b.bedNumber
          );
          const availableBeds = roomBeds.filter((bed) => bed.status === 'AVAILABLE').length;
          return {
            ...room,
            beds: roomBeds,
            availableBeds,
            occupiedBeds: roomBeds.length - availableBeds,
            isFull: roomBeds.length > 0 && availableBeds === 0
          };
        });
      return { ...floor, rooms: floorRooms };
    });

    const vacancyBySharingType = rooms.reduce((summary, room) => {
      const roomBeds = bedGroups[room._id.toString()] || [];
      const available = roomBeds.filter((bed) => bed.status === 'AVAILABLE').length;
      summary[room.sharingType] = (summary[room.sharingType] || 0) + available;
      return summary;
    }, {});

    return res.render('dashboard/index', {
      title: 'Dashboard',
      pg,
      stats: {
        totalFloors,
        totalRooms,
        totalBeds,
        occupiedBeds,
        availableBeds: totalBeds - occupiedBeds,
        activeTenants
      },
      vacancyBySharingType,
      roomsByFloor
    });
  } catch (error) {
    return next(error);
  }
};

exports.createPG = async (req, res, next) => {
  try {
    const { name, address } = req.body;
    if (!name || !address) {
      flash(req, 'danger', 'PG name and address are required.');
      return res.redirect('/dashboard');
    }

    await PG.create({ name, address, ownerId: req.session.ownerId || req.session.userId });
    flash(req, 'success', 'PG created. You can now add floors and rooms.');
    return res.redirect('/dashboard');
  } catch (error) {
    return next(error);
  }
};
