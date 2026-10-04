const mongoose = require('mongoose');

const customerSchema = new mongoose.Schema(
  {
    pgId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'PG',
      required: true,
      index: true
    },
    name: {
      type: String,
      required: true,
      trim: true
    },
    mobile: {
      type: String,
      required: true,
      trim: true
    },
    emergencyContact: {
      type: String,
      required: true,
      trim: true
    },
    permanentAddress: {
      type: String,
      required: true,
      trim: true
    },
    joiningDate: {
      type: Date,
      required: true
    },
    vacatingDate: {
      type: Date,
      default: null
    },
    monthlyRent: {
      type: Number,
      required: true,
      min: 0
    },
    depositAmount: {
      type: Number,
      required: true,
      min: 0
    },
    floorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Floor',
      required: true
    },
    roomId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Room',
      required: true
    },
    bedId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Bed',
      required: true
    },
    status: {
      type: String,
      enum: ['ACTIVE', 'VACATED'],
      default: 'ACTIVE',
      index: true
    }
  },
  { timestamps: true }
);

customerSchema.index(
  { bedId: 1, status: 1 },
  {
    unique: true,
    partialFilterExpression: { status: 'ACTIVE' }
  }
);
customerSchema.index(
  { pgId: 1, mobile: 1, status: 1 },
  {
    unique: true,
    partialFilterExpression: { status: 'ACTIVE' }
  }
);

module.exports = mongoose.model('Customer', customerSchema);
