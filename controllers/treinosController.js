const db = require('../config/db');

const listarTreinos = (req, res) => {
  const usuarioId = req.user.id;

  db.query(
    'SELECT * FROM treinos WHERE usuario_id = ? ORDER BY id DESC',
    [usuarioId],
    (err, result) => {
      if (err) {
        console.error(err);
        return res.status(500).json({ erro: 'Erro ao buscar treinos' });
      }

      res.json(result);
    }
  );
};

const cadastrarTreino = (req, res) => {
  const usuarioId = req.user.id;
  const { exercicio, carga, repeticoes, series, data } = req.body;

  const sql = `
    INSERT INTO treinos 
    (usuario_id, exercicio, carga, repeticoes, series, data_treino)
    VALUES (?, ?, ?, ?, ?, ?)
  `;

  db.query(
    sql,
    [usuarioId, exercicio, carga, repeticoes, series, data],
    (err, result) => {
      if (err) {
        console.error(err);
        return res.status(500).json({ erro: 'Erro ao cadastrar treino' });
      }

      res.status(201).json({
        mensagem: 'Treino cadastrado',
        id: result.insertId
      });
    }
  );
};

const deletarTreino = (req, res) => {
  const usuarioId = req.user.id;
  const { id } = req.params;

  db.query(
    'DELETE FROM treinos WHERE id = ? AND usuario_id = ?',
    [id, usuarioId],
    (err, result) => {
      if (err) {
        console.error(err);
        return res.status(500).json({ erro: 'Erro ao deletar treino' });
      }

      if (result.affectedRows === 0) {
        return res.status(404).json({
          erro: 'Treino não encontrado ou não pertence a este usuário'
        });
      }

      res.json({ mensagem: 'Treino deletado' });
    }
  );
};

module.exports = {
  listarTreinos,
  cadastrarTreino,
  deletarTreino
};