const { registerUser, loginUser, updateUserProfile, getUserProfile } = require('../controllers/userController');
const User = require('../models/userModel');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

jest.mock('../models/userModel');
jest.mock('bcryptjs');
jest.mock('jsonwebtoken');

describe('User Controller', () => {
  let req, res;

  beforeEach(() => {
    req = {
      body: {},
      user: { id: 'user123' },
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    jest.clearAllMocks();
  });

  describe('registerUser', () => {
    beforeEach(() => {
      req.body = {
        id: 'user123',
        name: 'John',
        lastName: 'Doe',
        mail: 'john.doe@example.com',
        password: 'Password123!',
        contactNumber: '1234567890',
        image: 'image.jpg',
      };
    });

    it('registra un usuario exitosamente', async () => {
      User.findOne.mockResolvedValue(null);
      bcrypt.hash.mockResolvedValue('hashedPassword');
      const mockUser = {
        _id: 'user123',
        name: 'John',
        lastName: 'Doe',
        mail: 'john.doe@example.com',
        password: 'hashedPassword',
        contactNumber: '1234567890',
        image: 'image.jpg',
        save: jest.fn().mockResolvedValue({ _id: 'user123' }),
      };
      User.mockImplementation(() => mockUser);

      await registerUser(req, res);

      expect(User.findOne).toHaveBeenCalledWith({ $or: [{ mail: 'john.doe@example.com' }, { _id: 'user123' }] });
      expect(bcrypt.hash).toHaveBeenCalledWith('Password123!', 10);
      expect(mockUser.save).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Registro completado exitosamente.',
        userId: 'user123',
      });
    });

    it('devuelve error 400 si faltan datos', async () => {
      req.body = { id: 'user123' }; // Faltan campos

      await registerUser(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Faltan datos en el cuerpo de la solicitud',
        code: 400,
      });
    });

    it('devuelve error 400 si el correo es inválido', async () => {
      req.body.mail = 'invalid-email';

      await registerUser(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Correo electrónico inválido',
        code: 400,
      });
    });

    it('devuelve error 400 si el número de contacto es inválido', async () => {
      req.body.contactNumber = '123abc';

      await registerUser(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Número de contacto inválido. Debe ser un número de hasta 10 dígitos.',
        code: 400,
      });
    });

    it('devuelve error 400 si el correo o ID ya está registrado', async () => {
      User.findOne.mockResolvedValue({ _id: 'user123' });

      await registerUser(req, res);

      expect(User.findOne).toHaveBeenCalledWith({ $or: [{ mail: 'john.doe@example.com' }, { _id: 'user123' }] });
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Correo o ID ya registrado',
        code: 400,
      });
    });

    it('devuelve error 400 si la contraseña es débil', async () => {
      req.body.password = 'weak';

      await registerUser(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Contraseña inválida. Debe incluir al menos 1 carácter especial, 1 letra, 1 número y tener un mínimo de 8 caracteres.',
        code: 400,
      });
    });

    it('devuelve error 500 si falla la base de datos', async () => {
      User.findOne.mockRejectedValue(new Error('Database error'));

      await registerUser(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Error al registrar el usuario',
        code: 500,
      });
    });
  });

  describe('loginUser', () => {
    beforeEach(() => {
      req.body = {
        mail: 'john.doe@example.com',
        password: 'Password123!',
      };
    });

    it('inicia sesión exitosamente', async () => {
      const mockUser = {
        _id: 'user123',
        mail: 'john.doe@example.com',
        password: 'hashedPassword',
      };
      User.findOne.mockResolvedValue(mockUser);
      bcrypt.compare.mockResolvedValue(true);
      jwt.sign.mockReturnValue('mockedToken');

      await loginUser(req, res);

      expect(User.findOne).toHaveBeenCalledWith({ mail: 'john.doe@example.com' });
      expect(bcrypt.compare).toHaveBeenCalledWith('Password123!', 'hashedPassword');
      expect(jwt.sign).toHaveBeenCalledWith(
        { id: 'user123', mail: 'john.doe@example.com' },
        process.env.JWT_SECRET,
        { expiresIn: '1h' }
      );
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Inicio de sesión exitoso',
        token: 'mockedToken',
        userId: 'user123',
      });
    });

    it('devuelve error 400 si faltan datos', async () => {
      req.body = { mail: 'john.doe@example.com' }; // Falta password

      await loginUser(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Faltan datos en el cuerpo de la solicitud',
        code: 400,
      });
    });

    it('devuelve error 400 si el correo es inválido', async () => {
      req.body.mail = 'invalid-email';

      await loginUser(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Correo electrónico inválido',
        code: 400,
      });
    });

    it('devuelve error 401 si el usuario no existe', async () => {
      User.findOne.mockResolvedValue(null);

      await loginUser(req, res);

      expect(User.findOne).toHaveBeenCalledWith({ mail: 'john.doe@example.com' });
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Correo o contraseña incorrectos',
        code: 401,
      });
    });

    it('devuelve error 401 si la contraseña es incorrecta', async () => {
      const mockUser = {
        _id: 'user123',
        mail: 'john.doe@example.com',
        password: 'hashedPassword',
      };
      User.findOne.mockResolvedValue(mockUser);
      bcrypt.compare.mockResolvedValue(false);

      await loginUser(req, res);

      expect(User.findOne).toHaveBeenCalledWith({ mail: 'john.doe@example.com' });
      expect(bcrypt.compare).toHaveBeenCalledWith('Password123!', 'hashedPassword');
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Correo o contraseña incorrectos',
        code: 401,
      });
    });

    it('devuelve error 500 si falla la base de datos', async () => {
      User.findOne.mockRejectedValue(new Error('Database error'));

      await loginUser(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        error: expect.any(Object), // El error puede ser el objeto Error
        code: 500,
      });
    });
  });

  describe('updateUserProfile', () => {
    beforeEach(() => {
      req.body = {
        name: 'Jane',
        lastName: 'Smith',
        contactNumber: '0987654321',
        image: 'new-image.jpg',
      };
    });

    it('actualiza el perfil del usuario exitosamente', async () => {
      const mockUser = {
        _id: 'user123',
        name: 'John',
        lastName: 'Doe',
        contactNumber: '1234567890',
        image: 'image.jpg',
      };
      User.findByIdAndUpdate.mockResolvedValue({
        _id: 'user123',
        name: 'Jane',
        lastName: 'Smith',
        contactNumber: '0987654321',
        image: 'new-image.jpg',
      });

      await updateUserProfile(req, res);

      expect(User.findByIdAndUpdate).toHaveBeenCalledWith(
        'user123',
        {
          name: 'Jane',
          lastName: 'Smith',
          contactNumber: '0987654321',
          image: 'new-image.jpg',
        },
        { new: true }
      );
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Perfil actualizado exitosamente.',
      });
    });

    it('devuelve error 400 si faltan datos', async () => {
      req.body = { name: 'Jane' }; // Faltan campos

      await updateUserProfile(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Faltan datos en el cuerpo de la solicitud',
        code: 400,
      });
    });

    it('devuelve error 400 si el número de contacto es inválido', async () => {
      req.body.contactNumber = '123abc';

      await updateUserProfile(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Número de contacto no válido',
        code: 400,
      });
    });

    it('devuelve error 404 si el usuario no existe', async () => {
      User.findByIdAndUpdate.mockResolvedValue(null);

      await updateUserProfile(req, res);

      expect(User.findByIdAndUpdate).toHaveBeenCalledWith(
        'user123',
        {
          name: 'Jane',
          lastName: 'Smith',
          contactNumber: '0987654321',
          image: 'new-image.jpg',
        },
        { new: true }
      );
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Usuario no encontrado',
        code: 404,
      });
    });

    it('devuelve error 500 si falla la base de datos', async () => {
      User.findByIdAndUpdate.mockRejectedValue(new Error('Database error'));

      await updateUserProfile(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Error al actualizar el perfil',
        code: 500,
      });
    });
  });

  describe('getUserProfile', () => {
    it('obtiene el perfil del usuario exitosamente', async () => {
      const mockUser = {
        _id: 'user123',
        name: 'John',
        lastName: 'Doe',
        mail: 'john.doe@example.com',
        contactNumber: '1234567890',
        image: 'image.jpg',
      };
      // Mock User.findById to return a query object that supports .select
      User.findById.mockReturnValue({
        select: jest.fn().mockResolvedValue(mockUser),
      });

      await getUserProfile(req, res);

      expect(User.findById).toHaveBeenCalledWith('user123');
      expect(User.findById().select).toHaveBeenCalledWith('name lastName _id mail contactNumber image');
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        userId: 'user123',
        name: 'John',
        lastName: 'Doe',
        mail: 'john.doe@example.com',
        contactNumber: '1234567890',
        image: 'image.jpg',
      });
    });

    it('devuelve error 404 si el usuario no existe', async () => {
      // Mock User.findById to return a query object that returns null
      User.findById.mockReturnValue({
        select: jest.fn().mockResolvedValue(null),
      });

      await getUserProfile(req, res);

      expect(User.findById).toHaveBeenCalledWith('user123');
      expect(User.findById().select).toHaveBeenCalledWith('name lastName _id mail contactNumber image');
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Usuario no encontrado',
        code: 404,
      });
    });

    it('devuelve error 500 si falla la base de datos', async () => {
      // Mock User.findById to throw an error
      User.findById.mockReturnValue({
        select: jest.fn().mockRejectedValue(new Error('Database error')),
      });

      await getUserProfile(req, res);

      expect(User.findById).toHaveBeenCalledWith('user123');
      expect(User.findById().select).toHaveBeenCalledWith('name lastName _id mail contactNumber image');
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Error al obtener el perfil del usuario',
        code: 500,
      });
    });
  });
});