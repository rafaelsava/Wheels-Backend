const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const userRoutes = require('./routes/userRoutes');
const vehicleRoutes = require('./routes/vehicleRoutes');
const tripRoutes = require('./routes/tripRoutes');
const authRoutes = require('./routes/authRoutes');

const app = express();
app.use(express.json());  // Middleware para procesar JSON
app.use(cors());  // Middleware para permitir peticiones desde otros dominios

// Función para conectar a MongoDB
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });
    console.log('Conectado a la base de datos MongoDB');
  } catch (err) {
    console.error('Error conectando a la base de datos', err);
    process.exit(1);  // Cierra el servidor si hay un error en la conexión
  }
};

// Conectar a la base de datos
connectDB();


// Usar las rutas de usuario
app.use('/api', userRoutes);
app.use('/api', vehicleRoutes);
app.use('/api', tripRoutes);
app.use('/api', authRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Servidor corriendo en el puerto ${PORT}`);
});
