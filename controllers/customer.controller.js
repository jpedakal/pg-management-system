const mongoose = require('mongoose');
const Floor = require('../models/Floor');
const Room = require('../models/Room');
const Bed = require('../models/Bed');
const Customer = require('../models/Customer');
const { getOwnerPG } = require('./dashboard.controller');
const { flash } = require('../middleware/auth.middleware');

exports.index = async (req, res, next) => {
  try {
    const pg = await getOwnerPG(req.session.userId);
    if (!pg) return res.redirect('/dashboard');

    const { status, floorId, roomId } = req.query;
    const filter = { pgId: pg._id };
    if (['ACTIVE', 'VACATED'].includes(status)) filter.status = status;
    if (floorId) filter.floorId = floorId;
    if (roomId) filter.roomId = roomId;

    const [customers, floors, rooms] = await Promise.all([
      Customer.find(filter)
        .populate('floorId roomId bedId')
        .sort({ status: 1, joiningDate: -1 })
        .lean(),
      Floor.find({ pgId: pg._id }).sort({ floorNumber: 1 }).lean(),
      Room.find({ pgId: pg._id }).sort({ roomNumber: 1 }).lean()
    ]);

    return res.render('customers/index', {
      title: 'Customers',
      pg,
      customers,
      floors,
      rooms,
      filters: { status, floorId, roomId }
    });
  } catch (error) {
    return next(error);
  }
};

exports.new = async (req, res, next) => {
  try {
    const pg = await getOwnerPG(req.session.userId);
    if (!pg) return res.redirect('/dashboard');

    const floors = await Floor.find({ pgId: pg._id }).sort({ floorNumber: 1 }).lean();
    return res.render('customers/new', { title: 'Add Customer', pg, floors });
  } catch (error) {
    return next(error);
  }
};

exports.create = async (req, res, next) => {
  const session = await mongoose.startSession();

  try {
    const pg = await getOwnerPG(req.session.userId);
    if (!pg) {
      await session.endSession();
      return res.redirect('/dashboard');
    }

    const {
      name,
      mobile,
      emergencyContact,
      permanentAddress,
      joiningDate,
      monthlyRent,
      depositAmount,
      floorId,
      roomId,
      bedId
    } = req.body;

    await session.withTransaction(async () => {
      const [floor, room, bed] = await Promise.all([
        Floor.findOne({ _id: floorId, pgId: pg._id }).session(session),
        Room.findOne({ _id: roomId, pgId: pg._id, floorId }).session(session),
        Bed.findOne({ _id: bedId, pgId: pg._id, roomId }).session(session)
      ]);

      if (!floor || !room || !bed) {
        throw new Error('Selected floor, room, or bed is invalid.');
      }

      if (bed.status !== 'AVAILABLE') {
        throw new Error('Selected bed is already occupied.');
      }

      const activeForBed = await Customer.exists({ bedId, status: 'ACTIVE' }).session(session);
      if (activeForBed) {
        throw new Error('Selected bed already has an active customer.');
      }

      const activeForMobile = await Customer.exists({
        pgId: pg._id,
        mobile,
        status: 'ACTIVE'
      }).session(session);
      if (activeForMobile) {
        throw new Error('This mobile number already has an active customer.');
      }

      const [customer] = await Customer.create(
        [
          {
            pgId: pg._id,
            name,
            mobile,
            emergencyContact,
            permanentAddress,
            joiningDate,
            monthlyRent,
            depositAmount,
            floorId,
            roomId,
            bedId,
            status: 'ACTIVE'
          }
        ],
        { session }
      );

      const updateResult = await Bed.updateOne(
        { _id: bedId, status: 'AVAILABLE', currentCustomerId: null },
        { status: 'OCCUPIED', currentCustomerId: customer._id },
        { session }
      );

      if (updateResult.modifiedCount !== 1) {
        throw new Error('Selected bed was just assigned. Please choose another bed.');
      }
    });

    flash(req, 'success', 'Customer onboarded and bed marked occupied.');
    return res.redirect('/customers');
  } catch (error) {
    flash(req, 'danger', error.message || 'Unable to onboard customer.');
    return res.redirect('/customers/new');
  } finally {
    session.endSession();
  }
};

exports.show = async (req, res, next) => {
  try {
    const pg = await getOwnerPG(req.session.userId);
    if (!pg) return res.redirect('/dashboard');

    const customer = await Customer.findOne({ _id: req.params.id, pgId: pg._id })
      .populate('floorId roomId bedId')
      .lean();

    if (!customer) {
      flash(req, 'danger', 'Customer not found.');
      return res.redirect('/customers');
    }

    return res.render('customers/show', { title: customer.name, pg, customer });
  } catch (error) {
    return next(error);
  }
};

exports.vacate = async (req, res, next) => {
  const session = await mongoose.startSession();

  try {
    const pg = await getOwnerPG(req.session.userId);
    if (!pg) {
      await session.endSession();
      return res.redirect('/dashboard');
    }

    const { vacatingDate } = req.body;

    await session.withTransaction(async () => {
      const customer = await Customer.findOne({ _id: req.params.id, pgId: pg._id }).session(session);
      if (!customer) throw new Error('Customer not found.');
      if (customer.status === 'VACATED') throw new Error('Customer is already vacated.');

      const bed = await Bed.findOne({
        _id: customer.bedId,
        pgId: pg._id,
        currentCustomerId: customer._id
      }).session(session);

      if (!bed) throw new Error('Current bed assignment could not be verified.');

      customer.status = 'VACATED';
      customer.vacatingDate = vacatingDate || new Date();
      await customer.save({ session });

      bed.status = 'AVAILABLE';
      bed.currentCustomerId = null;
      await bed.save({ session });
    });

    flash(req, 'success', 'Customer vacated and bed is now available.');
    return res.redirect(`/customers/${req.params.id}`);
  } catch (error) {
    flash(req, 'danger', error.message || 'Unable to vacate customer.');
    return res.redirect(`/customers/${req.params.id}`);
  } finally {
    session.endSession();
  }
};
