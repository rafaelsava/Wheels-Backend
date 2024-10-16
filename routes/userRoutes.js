const express = require('express');
const { registerUser ,getUserProfile} = require('../controllers/userController');
const { loginUser } = require('../controllers/userController');
const { updateUserProfile } = require('../controllers/userController');
const authenticateToken = require('../middlewares/authMiddleware');

const router = express.Router();

// Ruta para el registro completo del usuario
router.post('/register', registerUser);
router.post('/login', loginUser);
router.put('/profile', authenticateToken, updateUserProfile);
router.get('/profile', authenticateToken, getUserProfile);



module.exports = router;
