const jwt = require('jsonwebtoken');

// Middleware para verificar el token JWT
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];  // El token se envía en la cabecera Authorization: Bearer <token>

  if (!token) {
    return res.status(401).json({ error: 'Token faltante o no autorizado', code: 401 });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Token no válido', code: 403 });
    }

    req.user = user;  // Adjuntar la información del usuario al objeto req
    next();  // Continuar con la siguiente función
  });
};

module.exports = authenticateToken;
