const { addVehicle ,getVehicleDetails,updateVehicleDetails} = require('../controllers/vehicleController');
const User = require('../models/userModel');

// Mockear el modelo User
jest.mock('../models/userModel');

describe('addVehicle', () => {
  let req, res;

  beforeEach(() => {
    req = {
      body: {
        brand: 'Toyota',
        model: 'Corolla',
        carPlate: 'ABC123',
        capacity: 5,
        color: 'Red',
        picture: 'car.jpg',
        soat: 'SOAT123',
        userId: 'user123'
      }
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
    jest.clearAllMocks();
  });

  it('agrega un vehículo exitosamente', async () => {
    const mockUser = {
      _id: 'user123',
      vehicle: null,
      isDriver: false,
      save: jest.fn().mockResolvedValue(true)
    };
    User.findById.mockResolvedValue(mockUser);

    await addVehicle(req, res);

    expect(User.findById).toHaveBeenCalledWith('user123');
    expect(mockUser.vehicle).toEqual({
      brand: 'Toyota',
      model: 'Corolla',
      carPlate: 'ABC123',
      capacity: 5,
      color: 'Red',
      picture: 'car.jpg',
      soat: 'SOAT123'
    });
    expect(mockUser.isDriver).toBe(true);
    expect(mockUser.save).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith({
      message: 'Vehículo agregado exitosamente. El rol de conductor ha sido activado.'
    });
  });

  it('devuelve error 400 si faltan campos requeridos', async () => {
    req.body = { brand: 'Toyota' }; // Faltan campos

    await addVehicle(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      error: 'Información del vehículo inválida.',
      code: 400
    });
  });

  it('devuelve error 400 si la capacidad es inválida', async () => {
    req.body.capacity = 0;

    await addVehicle(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      error: 'Información del vehículo inválida.',
      code: 400
    });
  });

  it('devuelve error 404 si el usuario no existe', async () => {
    User.findById.mockResolvedValue(null);

    await addVehicle(req, res);

    expect(User.findById).toHaveBeenCalledWith('user123');
    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({
      error: 'Usuario no encontrado.',
      code: 404
    });
  });

  it('devuelve error 400 si el usuario ya tiene vehículo', async () => {
    const mockUser = {
      _id: 'user123',
      vehicle: { carPlate: 'XYZ789' }
    };
    User.findById.mockResolvedValue(mockUser);

    await addVehicle(req, res);

    expect(User.findById).toHaveBeenCalledWith('user123');
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      error: 'El usuario ya tiene un vehículo registrado.',
      code: 400
    });
  });

  it('devuelve error 500 si falla la base de datos', async () => {
    User.findById.mockRejectedValue(new Error('Database error'));

    await addVehicle(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      error: 'Error al agregar el vehículo.',
      code: 500,
    });
  });
});

describe('updateVehicleDetails', () => {
    let req, res;
  
    beforeEach(() => {
      req = {
        user: { id: 'user123' },
        body: {
          brand: 'Honda',
          model: 'Civic',
          carPlate: 'XYZ789'
        }
      };
      res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };
      jest.clearAllMocks();
    });
  
    it('actualiza los detalles del vehículo', async () => {
      const mockUser = {
        _id: 'user123',
        vehicle: {
          brand: 'Toyota',
          model: 'Corolla',
          carPlate: 'ABC123',
          capacity: 5,
          color: 'Red',
          picture: 'car.jpg',
          soat: 'SOAT123'
        },
        save: jest.fn().mockResolvedValue(true)
      };
      User.findById.mockResolvedValue(mockUser);
  
      await updateVehicleDetails(req, res);
  
      expect(User.findById).toHaveBeenCalledWith('user123');
      expect(mockUser.vehicle.brand).toBe('Honda');
      expect(mockUser.vehicle.model).toBe('Civic');
      expect(mockUser.vehicle.carPlate).toBe('XYZ789');
      expect(mockUser.vehicle.capacity).toBe(5);
      expect(mockUser.vehicle.color).toBe('Red');
      expect(mockUser.vehicle.picture).toBe('car.jpg');
      expect(mockUser.vehicle.soat).toBe('SOAT123');
      expect(mockUser.save).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Datos del vehículo actualizados exitosamente.',
        vehicle: {
          brand: 'Honda',
          model: 'Civic',
          carPlate: 'XYZ789',
          capacity: 5,
          color: 'Red',
          picture: 'car.jpg',
          soat: 'SOAT123'
        }
      });
    });
  
    it('devuelve error 404 si el vehículo no está registrado', async () => {
      const mockUser = {
        _id: 'user123',
        vehicle: null
      };
      User.findById.mockResolvedValue(mockUser);
  
      await updateVehicleDetails(req, res);
  
      expect(User.findById).toHaveBeenCalledWith('user123');
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Vehículo no registrado',
        code: 404
      });
    });
  
    it('devuelve error 400 si no hay campos para actualizar', async () => {
      req.body = {};
      const mockUser = {
        _id: 'user123',
        vehicle: { carPlate: 'ABC123' }
      };
      User.findById.mockResolvedValue(mockUser);
  
      await updateVehicleDetails(req, res);
  
      expect(User.findById).toHaveBeenCalledWith('user123');
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        error: 'No hay campos para actualizar',
        code: 400
      });
    });
  
    it('devuelve error 500 si falla la base de datos', async () => {
      User.findById.mockRejectedValue(new Error('Database error'));
  
      await updateVehicleDetails(req, res);
  
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Error al actualizar los datos del vehículo',
        code: 500
      });
    });
  });

  describe('getVehicleDetails', () => {
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
  
    it('devuelve los detalles del vehículo', async () => {
      const mockUser = {
        _id: 'user123',
        vehicle: {
          picture: 'car.jpg',
          carPlate: 'ABC123',
          capacity: 5,
          brand: 'Toyota',
          model: 'Corolla',
          soat: 'SOAT123'
        }
      };
      User.findById.mockImplementation(() => ({
        select: jest.fn().mockResolvedValue(mockUser)
      }));
  
      await getVehicleDetails(req, res);
  
      expect(User.findById).toHaveBeenCalledWith('user123');
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        vehicle: {
          picture: 'car.jpg',
          carPlate: 'ABC123',
          capacity: 5,
          brand: 'Toyota',
          model: 'Corolla',
          soat: 'SOAT123'
        }
      });
    });
  
    it('devuelve error 404 si el vehículo no está registrado', async () => {
      const mockUser = {
        _id: 'user123',
        vehicle: null
      };
      User.findById.mockImplementation(() => ({
        select: jest.fn().mockResolvedValue(mockUser)
      }));
  
      await getVehicleDetails(req, res);
  
      expect(User.findById).toHaveBeenCalledWith('user123');
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Vehículo no registrado',
        code: 404
      });
    });
  
    it('devuelve error 500 si falla la base de datos', async () => {
      User.findById.mockImplementation(() => ({
        select: jest.fn().mockRejectedValue(new Error('Database error'))
      }));
  
      await getVehicleDetails(req, res);
  
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Error al obtener los datos del vehículo',
        code: 500
      });
    });
  });