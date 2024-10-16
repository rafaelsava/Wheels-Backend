const express = require('express');
const authenticateToken = require('../middlewares/authMiddleware');
const { createTrip,getAvailableTrips, getTripDetails, reserveSeats,cancelReservation,getUserReservations , manageReservation,getDriverTrips,deleteTrip,editTrip} = require('../controllers/tripController');
const router = express.Router();

router.get('/trip/:tripId',authenticateToken, getTripDetails);
router.post('/trip', authenticateToken, createTrip);
router.get('/trips', authenticateToken, getAvailableTrips);
router.post('/trip/reserve/:tripId', authenticateToken, reserveSeats);
router.put('/trip/reserve/:tripId', authenticateToken, manageReservation);
router.delete('/trip/reserve/:tripId', authenticateToken, cancelReservation);  
router.get('/my-reservations', authenticateToken, getUserReservations);
router.get('/my-trips', authenticateToken, getDriverTrips);
router.delete('/trip/:tripId', authenticateToken, deleteTrip);
router.put('/trip/:tripId', authenticateToken, editTrip);
module.exports = router;
