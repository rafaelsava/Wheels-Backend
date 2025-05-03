const { createTrip,getAvailableTrips, getTripDetails, reserveSeats,cancelReservation,getUserReservations , manageReservation,getDriverTrips,deleteTrip,editTrip} = require('../controllers/tripController');
const Trip = require('../models/tripModel');
const User = require('../models/userModel');

jest.mock('../models/tripModel');
jest.mock('../models/userModel');

describe('createTrip', () => {
  let req, res;

  beforeEach(() => {
    req = {
      user: { id: 'user123' },
      body: {
        initialPoint: 'Punto A',
        finalPoint: 'Punto B',
        route: ['Punto A', 'Punto B'],
        hour: '10:00',
        seats: 4,
        price: 20
      }
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
    jest.clearAllMocks();
  });

  it('crea un viaje exitosamente', async () => {
    User.findById.mockResolvedValue({ _id: 'user123', isDriver: true });
    const mockTrip = {
      _id: 'trip123',
      save: jest.fn().mockResolvedValue({ _id: 'trip123' })
    };
    Trip.mockImplementation(() => mockTrip);

    await createTrip(req, res);

    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith({
      message: 'Viaje registrado exitosamente.',
      tripId: 'trip123'
    });
  });

  it('falla si el usuario no es conductor', async () => {
    User.findById.mockResolvedValue({ _id: 'user123', isDriver: false });

    await createTrip(req, res);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({
      error: 'No tienes permisos para crear un viaje. Debes ser conductor.',
      code: 403
    });
  });

  it('falla si faltan campos requeridos', async () => {
    req.body = { initialPoint: 'Punto A' }; // Faltan campos

    await createTrip(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      error: 'Información del viaje inválida.',
      code: 400
    });
  });

  it('falla si seats o price son inválidos', async () => {
    req.body.seats = 0; // Seats inválido
    User.findById.mockResolvedValue({ _id: 'user123', isDriver: true });

    await createTrip(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      error: 'Información del viaje inválida.',
      code: 400
    });
  });
});


describe('getAvailableTrips', () => {
  let req, res;

  beforeEach(() => {
    req = {
      user: { id: 'user123' }
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
    jest.clearAllMocks();
  });

  it('devuelve una lista de viajes disponibles', async () => {
    const mockTrips = [
      {
        _id: 'trip1',
        initialPoint: 'Punto A',
        finalPoint: 'Punto B',
        route: 'Punto A - Punto B',
        hour: '10:00',
        seats: 4,
        price: 20,
        idDriverTrip: 'driver1'
      },
      {
        _id: 'trip2',
        initialPoint: 'Punto C',
        finalPoint: 'Punto D',
        route: 'Punto C - Punto D',
        hour: '12:00',
        seats: 2,
        price: 15,
        idDriverTrip: 'driver2'
      }
    ];
    // Mockear Trip.find para devolver directamente los resultados
    Trip.find.mockResolvedValue(mockTrips);

    await getAvailableTrips(req, res);

    expect(Trip.find).toHaveBeenCalledWith({
      seats: { $gt: 0 },
      idDriverTrip: { $ne: 'user123' }
    });
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      trips: [
        {
          tripId: 'trip1',
          initialPoint: 'Punto A',
          finalPoint: 'Punto B',
          route: 'Punto A - Punto B',
          hour: '10:00',
          seatsAvailable: 4,
          price: 20
        },
        {
          tripId: 'trip2',
          initialPoint: 'Punto C',
          finalPoint: 'Punto D',
          route: 'Punto C - Punto D',
          hour: '12:00',
          seatsAvailable: 2,
          price: 15
        }
      ]
    });
  });

  it('devuelve una lista vacía si no hay viajes disponibles', async () => {
    // Mockear Trip.find para devolver un arreglo vacío
    Trip.find.mockResolvedValue([]);

    await getAvailableTrips(req, res);

    expect(Trip.find).toHaveBeenCalledWith({
      seats: { $gt: 0 },
      idDriverTrip: { $ne: 'user123' }
    });
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ trips: [] });
  });

  it('devuelve error 500 si falla la base de datos', async () => {
    // Mockear Trip.find para lanzar un error
    Trip.find.mockRejectedValue(new Error('Database error'));

    await getAvailableTrips(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      error: 'No se pudieron obtener los viajes disponibles.',
      code: 500
    });
  });
});


describe('getTripDetails', () => {
  let req, res;

  beforeEach(() => {
    req = {
      params: { tripId: 'trip123' }
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
    jest.clearAllMocks();
  });

  it('devuelve los detalles del viaje cuando existe', async () => {
    const mockTrip = {
      _id: 'trip123',
      initialPoint: 'Punto A',
      finalPoint: 'Punto B',
      route: 'Punto A - Punto B',
      hour: '10:00',
      seats: 4,
      price: 20,
      idDriverTrip: 'driver123'
    };
    const mockDriver = {
      _id: 'driver123',
      vehicle: {
        carPlate: 'ABC123',
        picture: 'car.jpg'
      }
    };
    Trip.findById.mockResolvedValue(mockTrip);
    User.findById.mockResolvedValue(mockDriver);

    await getTripDetails(req, res);

    expect(Trip.findById).toHaveBeenCalledWith('trip123');
    expect(User.findById).toHaveBeenCalledWith('driver123');
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      tripId: 'trip123',
      initialPoint: 'Punto A',
      finalPoint: 'Punto B',
      route: 'Punto A - Punto B',
      hour: '10:00',
      seatsAvailable: 4,
      price: 20,
      carPlate: 'ABC123',
      carPicture: 'car.jpg'
    });
  });

  it('devuelve error 404 si el viaje no existe', async () => {
    Trip.findById.mockResolvedValue(null);

    await getTripDetails(req, res);

    expect(Trip.findById).toHaveBeenCalledWith('trip123');
    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({
      error: 'Viaje no encontrado.',
      code: 404
    });
  });

  it('devuelve error 404 si el conductor no existe', async () => {
    const mockTrip = {
      _id: 'trip123',
      idDriverTrip: 'driver123'
    };
    Trip.findById.mockResolvedValue(mockTrip);
    User.findById.mockResolvedValue(null);

    await getTripDetails(req, res);

    expect(Trip.findById).toHaveBeenCalledWith('trip123');
    expect(User.findById).toHaveBeenCalledWith('driver123');
    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({
      error: 'Conductor no encontrado.',
      code: 404
    });
  });

  it('devuelve error 500 si falla la base de datos', async () => {
    Trip.findById.mockRejectedValue(new Error('Database error'));

    await getTripDetails(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      error: 'Error al obtener los detalles del viaje.',
      code: 500
    });
  });
});

describe('reserveSeats', () => {
  let req, res;

  beforeEach(() => {
    req = {
      params: { tripId: 'trip123' },
      body: {
        seatsReserved: 2,
        stops: ['Parada A', 'Parada B']
      },
      user: { id: 'user123' }
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
    jest.clearAllMocks();
  });

  it('reserva asientos exitosamente', async () => {
    const mockTrip = {
      _id: 'trip123',
      seats: 4,
      passengers: [],
      save: jest.fn().mockResolvedValue(true)
    };
    Trip.findById.mockResolvedValue(mockTrip);

    await reserveSeats(req, res);

    expect(Trip.findById).toHaveBeenCalledWith('trip123');
    expect(mockTrip.seats).toBe(2); // 4 - 2 = 2
    expect(mockTrip.passengers).toEqual([
      { userId: 'user123', stops: ['Parada A', 'Parada B'] }
    ]);
    expect(mockTrip.save).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      message: 'Has reservado 2 cupos exitosamente: desde Parada A y Parada B.',
      seatsRemaining: 2
    });
  });

  it('devuelve error 400 si faltan campos requeridos', async () => {
    req.body = { seatsReserved: 2 }; // Falta stops

    await reserveSeats(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      error: 'Información de la reserva inválida.',
      code: 400
    });
  });

  it('devuelve error 404 si el viaje no existe', async () => {
    Trip.findById.mockResolvedValue(null);

    await reserveSeats(req, res);

    expect(Trip.findById).toHaveBeenCalledWith('trip123');
    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({
      error: 'Viaje no encontrado.',
      code: 404
    });
  });

  it('devuelve error 400 si no hay suficientes asientos', async () => {
    const mockTrip = {
      _id: 'trip123',
      seats: 1,
      passengers: []
    };
    Trip.findById.mockResolvedValue(mockTrip);

    await reserveSeats(req, res);

    expect(Trip.findById).toHaveBeenCalledWith('trip123');
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      error: 'No hay suficientes cupos disponibles.',
      code: 400
    });
  });

  it('devuelve error 400 si las paradas no coinciden con los asientos', async () => {
    req.body.stops = ['Parada A']; // Solo 1 parada, pero seatsReserved es 2
    const mockTrip = {
      _id: 'trip123',
      seats: 4,
      passengers: []
    };
    Trip.findById.mockResolvedValue(mockTrip);

    await reserveSeats(req, res);

    expect(Trip.findById).toHaveBeenCalledWith('trip123');
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      error: 'La cantidad de paradas debe coincidir con el número de asientos reservados.',
      code: 400
    });
  });

  it('devuelve error 500 si falla la base de datos', async () => {
    Trip.findById.mockRejectedValue(new Error('Database error'));

    await reserveSeats(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      error: 'Error al realizar la reserva.',
      code: 500
    });
  });
});

describe('cancelReservation', () => {
  let req, res;

  beforeEach(() => {
    req = {
      params: { tripId: 'trip123' },
      user: { id: 'user123' }
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
    jest.clearAllMocks();
  });

  it('cancela una reserva exitosamente', async () => {
    const mockTrip = {
      _id: 'trip123',
      seats: 2,
      passengers: [
        { userId: 'user123', stops: ['Parada A', 'Parada B'] },
        { userId: 'user456', stops: ['Parada C'] }
      ],
      save: jest.fn().mockResolvedValue(true)
    };
    Trip.findById.mockResolvedValue(mockTrip);

    await cancelReservation(req, res);

    expect(Trip.findById).toHaveBeenCalledWith('trip123');
    expect(mockTrip.passengers).toEqual([{ userId: 'user456', stops: ['Parada C'] }]);
    expect(mockTrip.seats).toBe(4); // 2 + 2 = 4
    expect(mockTrip.save).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      message: 'Reserva cancelada exitosamente. Se han liberado 2 cupos.',
      seatsRemaining: 4
    });
  });

  it('devuelve error 404 si el viaje no existe', async () => {
    Trip.findById.mockResolvedValue(null);

    await cancelReservation(req, res);

    expect(Trip.findById).toHaveBeenCalledWith('trip123');
    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({
      error: 'Viaje no encontrado.',
      code: 404
    });
  });

  it('devuelve error 400 si el usuario no tiene reserva', async () => {
    const mockTrip = {
      _id: 'trip123',
      seats: 2,
      passengers: [{ userId: 'user456', stops: ['Parada C'] }]
    };
    Trip.findById.mockResolvedValue(mockTrip);

    await cancelReservation(req, res);

    expect(Trip.findById).toHaveBeenCalledWith('trip123');
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      error: 'El usuario no tiene una reserva activa en este viaje.',
      code: 400
    });
  });

  it('devuelve error 500 si falla la base de datos', async () => {
    Trip.findById.mockRejectedValue(new Error('Database error'));

    await cancelReservation(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      error: 'Error al cancelar la reserva.',
      code: 500
    });
  });
});

describe('getUserReservations', () => {
  let req, res;

  beforeEach(() => {
    req = {
      user: { id: 'user123' }
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
    jest.clearAllMocks();
  });

  it('devuelve una lista de reservas del usuario', async () => {
    const mockTrips = [
      {
        _id: 'trip1',
        initialPoint: 'Punto A',
        finalPoint: 'Punto B',
        route: 'Punto A - Punto B',
        price: 20,
        passengers: [
          { userId: 'user123', stops: ['Parada A', 'Parada B'] },
          { userId: 'user456', stops: ['Parada C'] }
        ]
      },
      {
        _id: 'trip2',
        initialPoint: 'Punto C',
        finalPoint: 'Punto D',
        route: 'Punto C - Punto D',
        price: 15,
        passengers: [{ userId: 'user123', stops: ['Parada D'] }]
      }
    ];
    Trip.find.mockResolvedValue(mockTrips);

    await getUserReservations(req, res);

    expect(Trip.find).toHaveBeenCalledWith({ 'passengers.userId': 'user123' });
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      reservations: [
        {
          tripId: 'trip1',
          initialPoint: 'Punto A',
          finalPoint: 'Punto B',
          route: 'Punto A - Punto B',
          seatsReserved: 2,
          price: 20
        },
        {
          tripId: 'trip2',
          initialPoint: 'Punto C',
          finalPoint: 'Punto D',
          route: 'Punto C - Punto D',
          seatsReserved: 1,
          price: 15
        }
      ]
    });
  });

  it('devuelve mensaje si no hay reservas', async () => {
    Trip.find.mockResolvedValue([]);

    await getUserReservations(req, res);

    expect(Trip.find).toHaveBeenCalledWith({ 'passengers.userId': 'user123' });
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      message: 'No tienes viajes reservados.'
    });
  });

  it('devuelve error 500 si falla la base de datos', async () => {
    Trip.find.mockRejectedValue(new Error('Database error'));

    await getUserReservations(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      error: 'Error al obtener las reservas del usuario.',
      code: 500
    });
  });
});

describe('manageReservation', () => {
  let req, res;

  beforeEach(() => {
    req = {
      params: { tripId: 'trip123' },
      body: {
        seatsReserved: 3,
        stops: ['Parada A', 'Parada B', 'Parada C']
      },
      user: { id: 'user123' }
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
    jest.clearAllMocks();
  });

  it('actualiza una reserva exitosamente', async () => {
    const mockTrip = {
      _id: 'trip123',
      seats: 2,
      passengers: [
        { userId: 'user123', stops: ['Parada X', 'Parada Y'] },
        { userId: 'user456', stops: ['Parada Z'] }
      ],
      save: jest.fn().mockResolvedValue(true)
    };
    Trip.findById.mockResolvedValue(mockTrip);

    await manageReservation(req, res);

    expect(Trip.findById).toHaveBeenCalledWith('trip123');
    expect(mockTrip.passengers[0].stops).toEqual(['Parada A', 'Parada B', 'Parada C']);
    expect(mockTrip.seats).toBe(1); // (2 + 2) - 3 = 1
    expect(mockTrip.save).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      message: 'Reserva actualizada exitosamente.',
      updatedReservation: { userId: 'user123', stops: ['Parada A', 'Parada B', 'Parada C'] },
      seatsRemaining: 1
    });
  });

  it('devuelve error 404 si el viaje no existe', async () => {
    Trip.findById.mockResolvedValue(null);

    await manageReservation(req, res);

    expect(Trip.findById).toHaveBeenCalledWith('trip123');
    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({
      error: 'Viaje no encontrado.',
      code: 404
    });
  });

  it('devuelve error 400 si el usuario no tiene reserva', async () => {
    const mockTrip = {
      _id: 'trip123',
      seats: 2,
      passengers: [{ userId: 'user456', stops: ['Parada Z'] }]
    };
    Trip.findById.mockResolvedValue(mockTrip);

    await manageReservation(req, res);

    expect(Trip.findById).toHaveBeenCalledWith('trip123');
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      error: 'No tienes una reserva en este viaje.',
      code: 400
    });
  });

  it('devuelve error 400 si no hay suficientes asientos', async () => {
    const mockTrip = {
      _id: 'trip123',
      seats: 1,
      passengers: [{ userId: 'user123', stops: ['Parada X'] }]
    };
    Trip.findById.mockResolvedValue(mockTrip);

    await manageReservation(req, res);

    expect(Trip.findById).toHaveBeenCalledWith('trip123');
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      error: 'No hay suficientes cupos disponibles para actualizar tu reserva.',
      code: 400
    });
  });

  it('devuelve error 400 si las paradas no coinciden con los asientos', async () => {
    req.body.stops = ['Parada A', 'Parada B']; // 2 paradas, pero seatsReserved es 3
    const mockTrip = {
      _id: 'trip123',
      seats: 2,
      passengers: [{ userId: 'user123', stops: ['Parada X', 'Parada Y'] }]
    };
    Trip.findById.mockResolvedValue(mockTrip);

    await manageReservation(req, res);

    expect(Trip.findById).toHaveBeenCalledWith('trip123');
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      error: 'La cantidad de paradas debe coincidir con el número de asientos reservados.',
      code: 400
    });
  });

  it('devuelve error 500 si falla la base de datos', async () => {
    Trip.findById.mockRejectedValue(new Error('Database error'));

    await manageReservation(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      error: 'Error al gestionar la reserva.',
      code: 500
    });
  });
});

describe('getDriverTrips', () => {
  let req, res;

  beforeEach(() => {
    req = {
      user: { id: 'user123' }
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
    jest.clearAllMocks();
  });

  it('devuelve una lista de viajes del conductor', async () => {
    User.findById.mockResolvedValue({ _id: 'user123', isDriver: true });
    const mockTrips = [
      {
        _id: 'trip1',
        initialPoint: 'Punto A',
        finalPoint: 'Punto B',
        route: 'Punto A - Punto B',
        seats: 4,
        price: 20,
        idDriverTrip: 'user123',
        passengers: [
          { userId: 'user456', stops: ['Parada A', 'Parada B'] },
          { userId: 'user789', stops: ['Parada C'] }
        ]
      },
      {
        _id: 'trip2',
        initialPoint: 'Punto C',
        finalPoint: 'Punto D',
        route: 'Punto C - Punto D',
        seats: 2,
        price: 15,
        idDriverTrip: 'user123',
        passengers: [{ userId: 'user456', stops: ['Parada D'] }]
      }
    ];
    Trip.find.mockResolvedValue(mockTrips);

    await getDriverTrips(req, res);

    expect(User.findById).toHaveBeenCalledWith('user123');
    expect(Trip.find).toHaveBeenCalledWith({ idDriverTrip: 'user123' });
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      trips: [
        {
          tripId: 'trip1',
          initialPoint: 'Punto A',
          finalPoint: 'Punto B',
          route: 'Punto A - Punto B',
          seats: 4,
          price: 20,
          reservations: 3 // 2 + 1
        },
        {
          tripId: 'trip2',
          initialPoint: 'Punto C',
          finalPoint: 'Punto D',
          route: 'Punto C - Punto D',
          seats: 2,
          price: 15,
          reservations: 1
        }
      ]
    });
  });

  it('devuelve mensaje si no hay viajes registrados', async () => {
    User.findById.mockResolvedValue({ _id: 'user123', isDriver: true });
    Trip.find.mockResolvedValue([]);

    await getDriverTrips(req, res);

    expect(User.findById).toHaveBeenCalledWith('user123');
    expect(Trip.find).toHaveBeenCalledWith({ idDriverTrip: 'user123' });
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      message: 'No tienes viajes registrados.'
    });
  });

  it('devuelve error 403 si el usuario no es conductor', async () => {
    User.findById.mockResolvedValue({ _id: 'user123', isDriver: false });

    await getDriverTrips(req, res);

    expect(User.findById).toHaveBeenCalledWith('user123');
    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({
      error: 'No eres conductor, no tienes acceso a esta funcionalidad.',
      code: 403
    });
  });

  it('devuelve error 403 si el usuario no existe', async () => {
    User.findById.mockResolvedValue(null);

    await getDriverTrips(req, res);

    expect(User.findById).toHaveBeenCalledWith('user123');
    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({
      error: 'No eres conductor, no tienes acceso a esta funcionalidad.',
      code: 403
    });
  });

  it('devuelve error 500 si falla la base de datos', async () => {
    User.findById.mockRejectedValue(new Error('Database error'));

    await getDriverTrips(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      error: 'Error al obtener los viajes del conductor.',
      code: 500
    });
  });
});

describe('deleteTrip', () => {
  let req, res;

  beforeEach(() => {
    req = {
      params: { tripId: 'trip123' },
      user: { id: 'user123' }
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
    jest.clearAllMocks();
  });

  it('elimina un viaje exitosamente', async () => {
    const mockTrip = {
      _id: 'trip123',
      idDriverTrip: 'user123'
    };
    Trip.findById.mockResolvedValue(mockTrip);
    Trip.findByIdAndDelete.mockResolvedValue(mockTrip);

    await deleteTrip(req, res);

    expect(Trip.findById).toHaveBeenCalledWith('trip123');
    expect(Trip.findByIdAndDelete).toHaveBeenCalledWith('trip123');
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      message: 'El viaje ha sido eliminado exitosamente.'
    });
  });

  it('devuelve error 404 si el viaje no existe', async () => {
    Trip.findById.mockResolvedValue(null);

    await deleteTrip(req, res);

    expect(Trip.findById).toHaveBeenCalledWith('trip123');
    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({
      error: 'Viaje no encontrado.',
      code: 404
    });
  });

  it('devuelve error 403 si el usuario no es el conductor', async () => {
    const mockTrip = {
      _id: 'trip123',
      idDriverTrip: 'user456'
    };
    Trip.findById.mockResolvedValue(mockTrip);

    await deleteTrip(req, res);

    expect(Trip.findById).toHaveBeenCalledWith('trip123');
    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({
      error: 'No tienes permiso para eliminar este viaje.',
      code: 403
    });
  });

  it('devuelve error 500 si falla la base de datos', async () => {
    Trip.findById.mockRejectedValue(new Error('Database error'));

    await deleteTrip(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      error: 'Error al eliminar el viaje.',
      code: 500
    });
  });
});

describe('editTrip', () => {
  let req, res;

  beforeEach(() => {
    req = {
      params: { tripId: 'trip123' },
      user: { id: 'user123' },
      body: {
        initialPoint: 'Punto X',
        finalPoint: 'Punto Y',
        route: 'Punto X - Punto Y',
        hour: '12:00',
        seats: 5,
        price: 25
      }
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
    jest.clearAllMocks();
  });

  it('edita un viaje exitosamente', async () => {
    const mockTrip = {
      _id: 'trip123',
      initialPoint: 'Punto A',
      finalPoint: 'Punto B',
      route: 'Punto A - Punto B',
      hour: '10:00',
      seats: 4,
      price: 20,
      idDriverTrip: 'user123',
      passengers: [],
      save: jest.fn().mockResolvedValue(true)
    };
    Trip.findById.mockResolvedValue(mockTrip);

    await editTrip(req, res);

    expect(Trip.findById).toHaveBeenCalledWith('trip123');
    expect(mockTrip.initialPoint).toBe('Punto X');
    expect(mockTrip.finalPoint).toBe('Punto Y');
    expect(mockTrip.route).toBe('Punto X - Punto Y');
    expect(mockTrip.hour).toBe('12:00');
    expect(mockTrip.seats).toBe(5);
    expect(mockTrip.price).toBe(25);
    expect(mockTrip.save).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      message: 'El viaje ha sido actualizado exitosamente.',
      updatedTrip: {
        tripId: 'trip123',
        initialPoint: 'Punto X',
        finalPoint: 'Punto Y',
        route: 'Punto X - Punto Y',
        hour: '12:00',
        seats: 5,
        price: 25,
        passengers: [],
        idDriverTrip: 'user123'
      }
    });
  });

  it('devuelve error 404 si el viaje no existe', async () => {
    Trip.findById.mockResolvedValue(null);

    await editTrip(req, res);

    expect(Trip.findById).toHaveBeenCalledWith('trip123');
    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({
      error: 'Viaje no encontrado.',
      code: 404
    });
  });

  it('devuelve error 403 si el usuario no es el conductor', async () => {
    const mockTrip = {
      _id: 'trip123',
      idDriverTrip: 'user456'
    };
    Trip.findById.mockResolvedValue(mockTrip);

    await editTrip(req, res);

    expect(Trip.findById).toHaveBeenCalledWith('trip123');
    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({
      error: 'No tienes permiso para editar este viaje.',
      code: 403
    });
  });

  it('devuelve error 500 si falla la base de datos', async () => {
    Trip.findById.mockRejectedValue(new Error('Database error'));

    await editTrip(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      error: 'Error al editar el viaje.',
      code: 500
    });
  });
});