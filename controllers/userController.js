const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/userModel');

// Registro completo del usuario
const registerUser = async (req, res) => {
  const { id, name, lastName, mail, password, contactNumber, image } = req.body;

  // Validar si falta algún dato en el body
  if (!id || !name || !lastName || !mail || !password || !contactNumber || !image) {
    return res.status(400).json({ error: 'Faltan datos en el cuerpo de la solicitud', code: 400 });
  }

  // Validar el formato del correo electrónico
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(mail)) {
    return res.status(400).json({ error: 'Correo electrónico inválido', code: 400 });
  }

  // Validar el número de contacto
  const contactNumberRegex = /^\d{1,10}$/;
  if (!contactNumberRegex.test(contactNumber)) {
    return res.status(400).json({ error: 'Número de contacto inválido. Debe ser un número de hasta 10 dígitos.', code: 400 });
  }

  try {
    // Verificar si el correo o el ID ya están registrados
    const existingUser = await User.findOne({ $or: [{ mail }, { _id: id }] });
    if (existingUser) {
      return res.status(400).json({ error: 'Correo o ID ya registrado', code: 400 });
    }

    // Validar la complejidad de la contraseña
    const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*#?&]).{8,}$/;
    if (!passwordRegex.test(password)) {
      return res.status(400).json({ error: 'Contraseña inválida. Debe incluir al menos 1 carácter especial, 1 letra, 1 número y tener un mínimo de 8 caracteres.', code: 400 });
    }

    // Hashear la contraseña
    const hashedPassword = await bcrypt.hash(password, 10);

    // Crear el usuario completo
    const newUser = new User({
      _id: id,
      name,
      lastName,
      mail,
      password: hashedPassword,
      contactNumber,
      image
    });

    await newUser.save();

    res.status(201).json({
      message: 'Registro completado exitosamente.',
      userId: newUser._id
    });
  } catch (error) {
    res.status(500).json({ error: 'Error al registrar el usuario', code: 500 });
  }
};
// Inicio de sesión
const loginUser = async (req, res) => {
  const { mail, password } = req.body;

  // Validar si falta algún dato en el body
  if (!mail || !password) {
    return res.status(400).json({ error: 'Faltan datos en el cuerpo de la solicitud', code: 400 });
  }

  // Validar el formato del correo electrónico
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(mail)) {
    return res.status(400).json({ error: 'Correo electrónico inválido', code: 400 });
  }
  try {
    // Verificar si el correo está registrado
    const user = await User.findOne({ mail });
    if (!user) {
      return res.status(401).json({ error: 'Correo o contraseña incorrectos', code: 401 });
    }

    // Verificar la contraseña
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Correo o contraseña incorrectos', code: 401 });
    }

    // Generar el token JWT
    const token = jwt.sign(
      { id: user._id, mail: user.mail },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    // Retornar el token en la respuesta
    res.status(200).json({
      message: 'Inicio de sesión exitoso',
      token: token,
      userId: user._id
    });
  } catch (error) {
    res.status(500).json({ error:error, code: 500 });
  }
};

// Actualizar perfil del usuario
const updateUserProfile = async (req, res) => {
  const { name, lastName, contactNumber, image } = req.body;  // Agregar 'image' al cuerpo de la solicitud
  const userId = req.user.id;  // El ID del usuario autenticado proviene del token

  // Validar si falta algún dato en el body
  if (!name || !lastName || !contactNumber || !image) {
    return res.status(400).json({ error: 'Faltan datos en el cuerpo de la solicitud', code: 400 });
  }

  try {
    // Validar formato del número de contacto (10 dígitos)
    const phoneRegex = /^[0-9]{10}$/;
    if (!phoneRegex.test(contactNumber)) {
      return res.status(400).json({ error: 'Número de contacto no válido', code: 400 });
    }

    // Actualizar la información del usuario en la base de datos
    const updatedUser = await User.findByIdAndUpdate(userId, {
      name,
      lastName,
      contactNumber,
      image  // Actualizar la imagen del usuario
    }, { new: true });

    if (!updatedUser) {
      return res.status(404).json({ error: 'Usuario no encontrado', code: 404 });
    }

    res.status(200).json({ message: 'Perfil actualizado exitosamente.' });
  } catch (error) {
    res.status(500).json({ error: 'Error al actualizar el perfil', code: 500 });
  }
};


// Ver perfil del usuario
const getUserProfile = async (req, res) => {
  const userId = req.user.id;  // El ID del usuario autenticado proviene del token

  try {
    // Buscar al usuario en la base de datos
    const user = await User.findById(userId).select('name lastName _id mail contactNumber image');
    
    if (!user) {
      return res.status(404).json({ error: 'Usuario no encontrado', code: 404 });
    }

    // Retornar los datos del perfil del usuario
    res.status(200).json({
      userId: user._id,
      name: user.name,
      lastName: user.lastName,
      mail: user.mail,
      contactNumber: user.contactNumber,
      image: user.image
    });
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener el perfil del usuario', code: 500 });
  }
};




module.exports = { registerUser , loginUser, updateUserProfile ,getUserProfile};
