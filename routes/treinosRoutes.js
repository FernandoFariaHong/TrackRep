const express = require('express');
const router = express.Router();

// Autenticação do middleware
const authMiddleware = require('../middlewares/authMiddleware');

// Pasta controllers
const {
  listarTreinos,
  cadastrarTreino,
  deletarTreino
} = require('../controllers/treinosController');

// rotas protegidas
router.get('/treinos', authMiddleware, listarTreinos);
router.post('/treinos', authMiddleware, cadastrarTreino);
router.delete('/treinos/:id', authMiddleware, deletarTreino);

module.exports = router;