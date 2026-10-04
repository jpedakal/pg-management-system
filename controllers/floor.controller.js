const Floor = require('../models/Floor');
const Room = require('../models/Room');
const Bed = require('../models/Bed');
const { getOwnerPG } = require('./dashboard.controller');
const { flash } = require('../middleware/auth.middleware');

exports.index = async (req, res, next) => {
  try {
    const pg = await getOwnerPG(req.session.userId);
    if (!pg) return res.redirect('/dashboard');

    const floors = await Floor.find({ pgId: pg._id }).sort({ floorNumber: 1 }).lean();
    return res.render('floors/index', { title: 'Floors', pg, floors });
  } catch (error) {
    return next(error);
  }
};

exports.create = async (req, res, next) => {
  try {
    const pg = await getOwnerPG(req.session.userId);
    if (!pg) return res.redirect('/dashboard');

    const { name, floorNumber } = req.body;
    await Floor.create({ pgId: pg._id, name, floorNumber });
    flash(req, 'success', 'Floor added.');
    return res.redirect('/floors');
  } catch (error) {
    if (error.code === 11000) flash(req, 'danger', 'That floor number already exists.');
    else flash(req, 'danger', 'Unable to add floor.');
    return res.redirect('/floors');
  }
};

exports.update = async (req, res, next) => {
  try {
    const pg = await getOwnerPG(req.session.userId);
    if (!pg) return res.redirect('/dashboard');

    const { name, floorNumber } = req.body;
    const floor = await Floor.findOneAndUpdate(
      { _id: req.params.id, pgId: pg._id },
      { name, floorNumber },
      { runValidators: true }
    );

    if (!floor) flash(req, 'danger', 'Floor not found.');
    else flash(req, 'success', 'Floor updated.');
    return res.redirect('/floors');
  } catch (error) {
    if (error.code === 11000) flash(req, 'danger', 'That floor number already exists.');
    else flash(req, 'danger', 'Unable to update floor.');
    return res.redirect('/floors');
  }
};

exports.remove = async (req, res, next) => {
  try {
    const pg = await getOwnerPG(req.session.userId);
    if (!pg) return res.redirect('/dashboard');

    const floor = await Floor.findOne({ _id: req.params.id, pgId: pg._id });
    if (!floor) {
      flash(req, 'danger', 'Floor not found.');
      return res.redirect('/floors');
    }

    const roomIds = await Room.find({ floorId: floor._id, pgId: pg._id }).distinct('_id');
    const occupiedBeds = await Bed.countDocuments({
      pgId: pg._id,
      roomId: { $in: roomIds },
      status: 'OCCUPIED'
    });

    if (occupiedBeds > 0) {
      flash(req, 'danger', 'Cannot delete a floor that has occupied beds.');
      return res.redirect('/floors');
    }

    await Bed.deleteMany({ pgId: pg._id, roomId: { $in: roomIds } });
    await Room.deleteMany({ pgId: pg._id, floorId: floor._id });
    await floor.deleteOne();
    flash(req, 'success', 'Floor and its empty rooms were deleted.');
    return res.redirect('/floors');
  } catch (error) {
    return next(error);
  }
};
