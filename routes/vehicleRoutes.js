const express = require('express');
const authenticateToken = require('../middlewares/authMiddleware');
const { addVehicle ,getVehicleDetails, updateVehicleDetails} = require('../controllers/vehicleController');

const router = express.Router();

// Ruta para agregar vehículo, protegida por autenticación
router.post('/vehicle', addVehicle);
router.get('/vehicle', authenticateToken, getVehicleDetails);
router.put('/vehicle', authenticateToken, updateVehicleDetails);

module.exports = router;
