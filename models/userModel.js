const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  _id: { type: String, required: true },
  name: { type: String, required: true },
  lastName: { type: String, required: true },
  mail: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  contactNumber: { type: String, required: true },
  isDriver: { type: Boolean, default: false },
  image: { type: String },
  vehicle: {
    brand: { type: String },
    model: { type: String },
    carPlate: { type: String },
    capacity: { type: Number },
    color: { type: String },
    picture: { type: String },  // URL o base64 de la imagen del vehículo
    soat: { type: String }  // URL o base64 de la foto del SOAT
  }
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);
