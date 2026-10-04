const mongoose = require('mongoose');

const roomSchema = new mongoose.Schema(
  {
    pgId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'PG',
      required: true,
      index: true
    },
    floorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Floor',
      required: true,
      index: true
    },
    roomNumber: {
      type: String,
      required: true,
      trim: true
    },
    sharingType: {
      type: Number,
      required: true,
      min: 1
    },
    monthlyRent: {
      type: Number,
      required: true,
      min: 0
    }
  },
  { timestamps: true }
);

roomSchema.index({ floorId: 1, roomNumber: 1 }, { unique: true });

module.exports = mongoose.model('Room', roomSchema);
