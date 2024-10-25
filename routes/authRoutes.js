const express = require('express');
const authenticateToken = require('../middlewares/authMiddleware');

const router = express.Router();

router.get('/verify-token', authenticateToken, (req, res) => {
  res.status(200).json({ message: 'Token válido', user: req.user });
});

module.exports = router;
