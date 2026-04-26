const express = require('express');
const router = express.Router();

// Importação do registro e login
const { register, login } = require('../controllers/authController');

// Rota do cadastro
router.post('/register', register);

// Rota do login
router.post('/login', login);

module.exports = router;