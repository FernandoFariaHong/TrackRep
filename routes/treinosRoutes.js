const express = require('express');
const router = express.Router();

const {
  listarTreinos,
  cadastrarTreino,
  deletarTreino
} = require('../controllers/treinosController');

router.get('/treinos', listarTreinos);
router.post('/treinos', cadastrarTreino);
router.delete('/treinos/:id', deletarTreino);

module.exports = router;