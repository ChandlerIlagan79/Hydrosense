// models/HydrationTest.js
const mongoose = require('mongoose');

const hydrationTestSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  hydrationLevel: {
    type: String,
    required: true
  },
   testDuration: {
    type: Number,
    default: 0
  },
  sensorReading: Number,
  notes: String,
  isFirstTest: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('HydrationTest', hydrationTestSchema);
