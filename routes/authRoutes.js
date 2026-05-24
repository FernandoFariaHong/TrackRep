const express = require('express');
const router = express.Router();

const authMiddleware = require('../middlewares/authMiddleware');

const {
  register,
  login,
  excluirConta,
  buscarExerciciosExternos
} = require('../controllers/authController');

// Cadastro
router.post('/register', register);

// Login
router.post('/login', login);

// Buscar exercícios em API externa
router.get('/api/exercicios', authMiddleware, buscarExerciciosExternos);

// Excluir conta
router.delete(
  '/usuarios/minha-conta',
  authMiddleware,
  excluirConta
);

module.exports = router;