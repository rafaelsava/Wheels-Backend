const Trip = require('../models/tripModel');
const User = require('../models/userModel');

// Crear un nuevo viaje
const createTrip = async (req, res) => {
  const { initialPoint, finalPoint, route, hour, seats, price } = req.body;
  const driverId = req.user.id;  // ID del conductor autenticado

  try {
    // Verificar si el usuario es un conductor
    const user = await User.findById(driverId);
    if (!user || !user.isDriver) {
      return res.status(403).json({ error: 'No tienes permisos para crear un viaje. Debes ser conductor.', code: 403 });
    }
    // Validar que todos los campos requeridos estén presentes
    if (!initialPoint || !finalPoint || !route || !hour || !seats || !price) {
      return res.status(400).json({ error: 'Información del viaje inválida.', code: 400 });
    }

    // Validar que la cantidad de asientos sea un número positivo
    if (isNaN(seats) || seats <= 0) {
      return res.status(400).json({ error: 'La cantidad de asientos debe ser un número positivo.', code: 400 });
    }

    // Validar que el precio sea un número positivo
    if (isNaN(price) || price <= 0) {
      return res.status(400).json({ error: 'El precio debe ser un número positivo.', code: 400 });
    }

    // Crear el viaje y asociarlo al conductor autenticado
    const newTrip = new Trip({
      initialPoint,
      finalPoint,
      route,
      hour,
      seats,
      price,
      idDriverTrip: driverId  // Asociar el viaje con el conductor autenticado
    });

    await newTrip.save();

    res.status(201).json({
      message: 'Viaje registrado exitosamente.',
      tripId: newTrip._id
    });
  } catch (error) {
    res.status(500).json({ error: 'Error al registrar el viaje.', code: 500 });
    console.log(error);
  }
};

const getAvailableTrips = async (req, res) => {
    try {
      // Obtener todos los viajes
      const trips = await Trip.find();
  
      // Filtrar los viajes que tengan al menos un cupo disponible
      const availableTrips = trips.map(trip => ({
        tripId: trip._id,
        initialPoint: trip.initialPoint,
        finalPoint: trip.finalPoint,
        route: trip.route,
        hour: trip.hour,
        seatsAvailable: trip.seats,  // Asientos disponibles
        price: trip.price
      }));
  
      res.status(200).json({ trips: availableTrips });
    } catch (error) {
      res.status(500).json({ error: 'No se pudieron obtener los viajes disponibles.', code: 500 });
    }
  };
// Obtener los detalles de un viaje específico
const getTripDetails = async (req, res) => {
    const { tripId } = req.params;
  
    try {
      // Buscar el viaje en la base de datos
      const trip = await Trip.findById(tripId);
      if (!trip) {
        return res.status(404).json({ error: 'Viaje no encontrado.', code: 404 });
      }
  
      // Buscar el conductor asociado al viaje
      const driver = await User.findById(trip.idDriverTrip);
      if (!driver) {
        return res.status(404).json({ error: 'Conductor no encontrado.', code: 404 });
      }
  
      // Construir la respuesta con los detalles del viaje y del vehículo
      const tripDetails = {
        tripId: trip._id,
        initialPoint: trip.initialPoint,
        finalPoint: trip.finalPoint,
        route: trip.route,
        hour: trip.hour,
        seatsAvailable: trip.seats,  // Asientos disponibles
        price: trip.price,
        carPlate: driver.vehicle.carPlate,  // Placa del carro del conductor
        carPicture: driver.vehicle.picture  // Foto del vehículo del conductor
      };
  
      res.status(200).json(tripDetails);
    } catch (error) {
      res.status(500).json({ error: 'Error al obtener los detalles del viaje.', code: 500 });
      console.log(error);
    }
  };
  // Reservar cupos en un viaje
  const reserveSeats = async (req, res) => {
    const {tripId} = req.params
    const { seatsReserved, stops } = req.body;
    const userId = req.user.id;  // Obtener el userId del token JWT
  
    try {
    // Validar que todos los campos requeridos estén presentes
    if (!tripId || !seatsReserved || !stops) {
      return res.status(400).json({ error: 'Información de la reserva inválida.', code: 400 });
    }
      // Buscar el viaje en la base de datos
      const trip = await Trip.findById(tripId);
      if (!trip) {
        return res.status(404).json({ error: 'Viaje no encontrado.', code: 404 });
      }
  
      // Validar que el número de cupos solicitados no exceda los cupos disponibles
      if (trip.seats < seatsReserved) {
        return res.status(400).json({ error: 'No hay suficientes cupos disponibles.', code: 400 });
      }
      // Verificar que la longitud de la lista de paradas coincida con la cantidad de asientos reservados
      if (stops.length !== seatsReserved) {
        return res.status(400).json({ error: 'La cantidad de paradas debe coincidir con el número de asientos reservados.', code: 400 });
      }
      // Descontar los cupos reservados del total disponible
      trip.seats -= seatsReserved;
  
      // Guardar la información de la reserva en el viaje
      trip.passengers = trip.passengers || [];
      trip.passengers.push({
        userId,  // El userId viene del token
        stops  // Guardar las paradas como un arreglo de strings
      });
  
      await trip.save();
  
      res.status(200).json({
        message: `Has reservado ${seatsReserved} cupos exitosamente: desde ${stops.join(' y ')}.`,
        seatsRemaining: trip.seats
      });
    } catch (error) {
      res.status(500).json({ error: 'Error al realizar la reserva.', code: 500 });
      console.log(error);
    }
  };

  const cancelReservation = async (req, res) => {
    const { tripId } = req.params;
    const userId = req.user.id;  // Obtener el userId del token JWT
  
    try {
      // Buscar el viaje en la base de datos
      const trip = await Trip.findById(tripId);
      if (!trip) {
        return res.status(404).json({ error: 'Viaje no encontrado.', code: 404 });
      }
  
      // Buscar la reserva del usuario en el viaje
      const passengerIndex = trip.passengers.findIndex(passenger => passenger.userId === userId);
      if (passengerIndex === -1) {
        return res.status(400).json({ error: 'El usuario no tiene una reserva activa en este viaje.', code: 400 });
      }
  
      // Obtener la cantidad de cupos reservados por el usuario
      const seatsToRelease = trip.passengers[passengerIndex].stops.length;
  
      // Eliminar la reserva del usuario
      trip.passengers.splice(passengerIndex, 1);
  
      // Restaurar los cupos del viaje
      trip.seats += seatsToRelease;
  
      // Guardar los cambios en la base de datos
      await trip.save();
  
      res.status(200).json({
        message: `Reserva cancelada exitosamente. Se han liberado ${seatsToRelease} cupos.`,
        seatsRemaining: trip.seats
      });
    } catch (error) {
      res.status(500).json({ error: 'Error al cancelar la reserva.', code: 500 });
      console.log(error);
    }
  };


  const getUserReservations = async (req, res) => {
    const userId = req.user.id;  // Obtener el userId del token JWT
  
    try {
      // Buscar todos los viajes donde el usuario ha reservado cupos
      const trips = await Trip.find({ 'passengers.userId': userId });
  
      // Si el usuario no tiene reservas
      if (trips.length === 0) {
        return res.status(200).json({ message: 'No tienes viajes reservados.' });
      }
  
      // Formatear la respuesta para mostrar solo los detalles necesarios
      const reservations = trips.map(trip => {
        const userReservation = trip.passengers.find(passenger => passenger.userId == userId);
        const seatsReserved = userReservation.stops.length;
  
        return {
          tripId: trip._id,
          initialPoint: trip.initialPoint,
          finalPoint: trip.finalPoint,
          route: trip.route,
          seatsReserved,
          price: trip.price
        };
      });
  
      res.status(200).json({ reservations });
    } catch (error) {
      res.status(500).json({ error: 'Error al obtener las reservas del usuario.', code: 500 });
      console.log(error);
    }
  };
  
  // Gestionar la reserva de un usuario (cambiar paradas y número de cupos)
  const manageReservation = async (req, res) => {
    const {tripId} = req.params;
    const { seatsReserved, stops } = req.body;  // Obtener el tripId, seatsReserved y las nuevas paradas desde el cuerpo de la solicitud
    const userId = req.user.id;  // Obtener el userId del token JWT
  
    try {
      // Buscar el viaje en la base de datos
      const trip = await Trip.findById(tripId);
      if (!trip) {
        return res.status(404).json({ error: 'Viaje no encontrado.', code: 404 });
      }
  
      // Buscar la reserva del usuario en el viaje
      const passenger = trip.passengers.find(passenger => passenger.userId === userId);
      if (!passenger) {
        return res.status(400).json({ error: 'No tienes una reserva en este viaje.', code: 400 });
      }
  
      // Verificar que los nuevos cupos (paradas) no excedan los cupos disponibles
      const newSeats = seatsReserved;
      const availableSeats = trip.seats + passenger.stops.length;  // Cupos disponibles más los cupos actuales del usuario
  
      if (newSeats > availableSeats) {
        return res.status(400).json({ error: 'No hay suficientes cupos disponibles para actualizar tu reserva.', code: 400 });
      }
      
      // Verificar que la longitud de la lista de paradas coincida con la cantidad de asientos reservados
      if (stops.length !== seatsReserved) {
        return res.status(400).json({ error: 'La cantidad de paradas debe coincidir con el número de asientos reservados.', code: 400 });
      }
  
      // Actualizar las paradas del usuario
      passenger.stops = stops;
  
      // Actualizar los cupos totales disponibles
      trip.seats = availableSeats - newSeats;
  
      // Guardar los cambios en la base de datos
      await trip.save();
  
      res.status(200).json({
        message: 'Reserva actualizada exitosamente.',
        updatedReservation: passenger,
        seatsRemaining: trip.seats
      });
    } catch (error) {
      res.status(500).json({ error: 'Error al gestionar la reserva.', code: 500 });
      console.log(error);
    }
  };

  // Ver los viajes registrados por el conductor
const getDriverTrips = async (req, res) => {
  const userId = req.user.id;  // Obtener el userId del token JWT

  try {
    // Validar que el usuario sea un conductor
    const user = await User.findById(userId);
    if (!user || !user.isDriver) {
      return res.status(403).json({ error: 'No eres conductor, no tienes acceso a esta funcionalidad.', code: 403 });
    }

    // Buscar los viajes registrados por el conductor
    const trips = await Trip.find({ idDriverTrip: userId });

    // Si el conductor no ha registrado ningún viaje
    if (trips.length === 0) {
      return res.status(200).json({ message: 'No tienes viajes registrados.' });
    }

    // Formatear la respuesta para mostrar solo los detalles necesarios (sin la hora)
    const driverTrips = trips.map(trip => ({
      tripId: trip._id,
      initialPoint: trip.initialPoint,
      finalPoint: trip.finalPoint,
      route: trip.route,
      seats: trip.seats,
      price: trip.price
    }));

    res.status(200).json({ trips: driverTrips });
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener los viajes del conductor.', code: 500 });
    console.log(error);
  }
};

// Eliminar un viaje registrado por el conductor
const deleteTrip = async (req, res) => {
  const { tripId } = req.params;  // Obtener el tripId de los parámetros de la URL
  const userId = req.user.id;  // Obtener el userId del token JWT

  try {
    // Buscar el viaje en la base de datos
    const trip = await Trip.findById(tripId);
    if (!trip) {
      return res.status(404).json({ error: 'Viaje no encontrado.', code: 404 });
    }

    // Validar que el usuario que intenta eliminar el viaje sea el conductor que lo creó
    if (trip.idDriverTrip !== userId) {
      return res.status(403).json({ error: 'No tienes permiso para eliminar este viaje.', code: 403 });
    }

    // Eliminar el viaje de la base de datos
    await Trip.findByIdAndDelete(tripId);

    res.status(200).json({ message: 'El viaje ha sido eliminado exitosamente.' });
  } catch (error) {
    res.status(500).json({ error: 'Error al eliminar el viaje.', code: 500 });
    console.log(error);
  }
};



// Editar un viaje registrado por el conductor
const editTrip = async (req, res) => {
  const { tripId } = req.params;  // Obtener el tripId de los parámetros de la URL
  const userId = req.user.id;  // Obtener el userId del token JWT
  const { initialPoint, finalPoint, hour, seats, price } = req.body;  // Obtener los nuevos datos del viaje

  try {
    // Buscar el viaje en la base de datos
    const trip = await Trip.findById(tripId);
    if (!trip) {
      return res.status(404).json({ error: 'Viaje no encontrado.', code: 404 });
    }

    // Validar que el usuario que intenta editar el viaje sea el conductor que lo creó
    if (trip.idDriverTrip !== userId) {
      return res.status(403).json({ error: 'No tienes permiso para editar este viaje.', code: 403 });
    }

    // Actualizar los detalles del viaje con los nuevos datos proporcionados
    if (initialPoint) trip.initialPoint = initialPoint;
    if (finalPoint) trip.finalPoint = finalPoint;
    if (hour) trip.hour = hour;
    if (seats) trip.seats = seats;
    if (price) trip.price = price;

    // Guardar los cambios en la base de datos
    await trip.save();

    // Devolver solo la información solicitada
    res.status(200).json({
      message: 'El viaje ha sido actualizado exitosamente.',
      updatedTrip: {
        tripId: trip._id,
        initialPoint: trip.initialPoint,
        finalPoint: trip.finalPoint,
        route: trip.route,
        hour: trip.hour,
        seats: trip.seats,
        price: trip.price,
        passengers: trip.passengers,
        idDriverTrip: trip.idDriverTrip
      }
    });
  } catch (error) {
    res.status(500).json({ error: 'Error al editar el viaje.', code: 500 });
    console.log(error);
  }
};

module.exports = { createTrip, getAvailableTrips, getTripDetails, reserveSeats,cancelReservation , getUserReservations, manageReservation , getDriverTrips,deleteTrip,editTrip};
