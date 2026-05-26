const express = require('express');
const router = express.Router();

// Autenticação do middleware
const authMiddleware = require('../middlewares/authMiddleware');

// Controllers
const {
  listarTreinos,
  listarSessoesTreino,
  cadastrarTreino,
  salvarSessaoTreino,
  deletarTreino,
  deletarSessaoTreino
} = require('../controllers/treinosController');

// ====================
// LISTAGENS
// ====================

// Lista antiga
router.get(
  '/treinos',
  authMiddleware,
  listarTreinos
);

// Lista de sessões completas
router.get(
  '/treinos/sessoes',
  authMiddleware,
  listarSessoesTreino
);

// ====================
// CADASTROS
// ====================

// Cadastro antigo
router.post(
  '/treinos',
  authMiddleware,
  cadastrarTreino
);

// Salvar treino completo
router.post(
  '/treinos/sessao',
  authMiddleware,
  salvarSessaoTreino
);

// ====================
// EXCLUSÕES
// ====================

// Excluir sessão completa
router.delete(
  '/treinos/sessoes/:id',
  authMiddleware,
  deletarSessaoTreino
);

// Excluir treino antigo
router.delete(
  '/treinos/:id',
  authMiddleware,
  deletarTreino
);

module.exports = router;