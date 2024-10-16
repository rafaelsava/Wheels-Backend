const mongoose = require('mongoose');

const tripSchema = new mongoose.Schema({
  initialPoint: { type: String, required: true },
  finalPoint: { type: String, required: true },
  route: { type: String, required: true },
  hour: { type: String, required: true },
  seats: { type: Number, required: true },
  price: { type: Number, required: true },
  idDriverTrip: { type: String, required: true },
  passengers: [
    {
      userId: { type: String}, 
      stops: [{ type: String }],
      _id: false
          }
  ]
}, { timestamps: true });

module.exports = mongoose.model('Trip', tripSchema);
