const User = require('../models/userModel');

// Agregar información del vehículo
const addVehicle = async (req, res) => {
  const { brand, model, carPlate, capacity, color, picture, soat,userId } = req.body;

  try {
    // Validar que todos los campos requeridos estén presentes
    if (!brand || !model || !carPlate || !capacity || !color || !picture || !soat) {
      return res.status(400).json({ error: 'Información del vehículo inválida.', code: 400 });
    }

    // Validar que la capacidad sea un número positivo
    if (isNaN(capacity) || capacity <= 0) {
      return res.status(400).json({ error: 'Capacidad inválida.', code: 400 });
    }

    // Buscar al usuario en la base de datos
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'Usuario no encontrado.', code: 404 });
    }
    
    // Verificar si el usuario ya tiene un vehículo registrado
    if (user.vehicle && user.vehicle.carPlate) {
        return res.status(400).json({ error: 'El usuario ya tiene un vehículo registrado.', code: 400 });
      }
    // Actualizar la información del vehículo y cambiar el rol a conductor
    user.vehicle = { brand, model, carPlate, capacity, color, picture, soat };
    user.isDriver = true;

    await user.save();

    res.status(201).json({ message: 'Vehículo agregado exitosamente. El rol de conductor ha sido activado.' });
  } catch (error) {
    res.status(500).json({ error: 'Error al agregar el vehículo.', code: 500 });
  }
};

// Obtener detalles del vehículo
const getVehicleDetails = async (req, res) => {
  const userId = req.user.id;  // El ID del usuario autenticado proviene del token

  try {
    // Buscar al usuario en la base de datos
    const user = await User.findById(userId).select('vehicle');
    
    if (!user || !user.vehicle || !user.vehicle.carPlate) {
      return res.status(404).json({ error: 'Vehículo no registrado', code: 404 });
    }

    // Retornar los datos del vehículo
    res.status(200).json({
      vehicle: {
        picture: user.vehicle.picture,
        carPlate: user.vehicle.carPlate,
        capacity: user.vehicle.capacity,
        brand: user.vehicle.brand,
        model: user.vehicle.model,
        soat: user.vehicle.soat
      }
    });
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener los datos del vehículo', code: 500 });
  }
};

// Actualizar datos del vehículo del usuario
const updateVehicleDetails = async (req, res) => {
  const userId = req.user.id;  // El ID del usuario autenticado proviene del token
  const { brand, model, carPlate, capacity, color, picture, soat } = req.body;  // Datos que se pueden actualizar

  try {
    // Buscar al usuario en la base de datos
    const user = await User.findById(userId);
    
    if (!user || !user.vehicle || !user.vehicle.carPlate) {
      return res.status(404).json({ error: 'Vehículo no registrado', code: 404 });
    }

    // Validar que al menos un campo para actualizar esté presente
    if (!brand && !model && !carPlate && !capacity && !color && !picture && !soat) {
      return res.status(400).json({ error: 'No hay campos para actualizar', code: 400 });
    }

    // Actualizar solo los campos proporcionados en el body
    if (brand) user.vehicle.brand = brand;
    if (model) user.vehicle.model = model;
    if (carPlate) user.vehicle.carPlate = carPlate;
    if (capacity) user.vehicle.capacity = capacity;
    if (color) user.vehicle.color = color;
    if (picture) user.vehicle.picture = picture;
    if (soat) user.vehicle.soat = soat;

    // Guardar los cambios en la base de datos
    await user.save();

    res.status(200).json({
      message: 'Datos del vehículo actualizados exitosamente.',
      vehicle: user.vehicle
    });
  } catch (error) {
    res.status(500).json({ error: 'Error al actualizar los datos del vehículo', code: 500 });
    console.log(error);
  }
};


module.exports = { addVehicle, getVehicleDetails ,updateVehicleDetails};
