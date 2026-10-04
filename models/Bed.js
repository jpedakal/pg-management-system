const mongoose = require('mongoose');

const bedSchema = new mongoose.Schema(
  {
    pgId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'PG',
      required: true,
      index: true
    },
    roomId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Room',
      required: true,
      index: true
    },
    bedNumber: {
      type: Number,
      required: true,
      min: 1
    },
    status: {
      type: String,
      enum: ['AVAILABLE', 'OCCUPIED'],
      default: 'AVAILABLE',
      index: true
    },
    currentCustomerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Customer',
      default: null
    }
  },
  { timestamps: true }
);

bedSchema.index({ roomId: 1, bedNumber: 1 }, { unique: true });
bedSchema.index(
  { currentCustomerId: 1 },
  {
    unique: true,
    partialFilterExpression: { currentCustomerId: { $type: 'objectId' } }
  }
);

module.exports = mongoose.model('Bed', bedSchema);
