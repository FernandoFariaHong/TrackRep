const db = require('../config/db');

const listarTreinos = (req, res) => {
  db.query('SELECT * FROM treinos', (err, result) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ erro: 'Erro ao buscar treinos' });
    }

    res.json(result);
  });
};

const cadastrarTreino = (req, res) => {
  const { exercicio, carga, repeticoes, series, data } = req.body;

  const sql = `
  INSERT INTO treinos (exercicio, carga, repeticoes, series, data_treino)
  VALUES (?, ?, ?, ?, ?)
  `;

  db.query(sql, [exercicio, carga, repeticoes, series, data], (err, result) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ erro: 'Erro ao cadastrar treino' });
    }

    res.status(201).json({
      mensagem: 'Treino cadastrado',
      id: result.insertId
    });
  });
};

const deletarTreino = (req, res) => {
  const { id } = req.params;

  db.query('DELETE FROM treinos WHERE id = ?', [id], (err, result) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ erro: 'Erro ao deletar treino' });
    }

    res.json({ mensagem: 'Treino deletado' });
  });
};

module.exports = {
  listarTreinos,
  cadastrarTreino,
  deletarTreino
};
