const mongoose = require('mongoose');

const floorSchema = new mongoose.Schema(
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
    floorNumber: {
      type: Number,
      required: true,
      min: 0
    }
  },
  { timestamps: true }
);

floorSchema.index({ pgId: 1, floorNumber: 1 }, { unique: true });

module.exports = mongoose.model('Floor', floorSchema);
