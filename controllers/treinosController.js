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

const listarSessoesTreino = (req, res) => {
  const usuarioId = req.user.id;

  const sql = `
    SELECT 
      s.id AS sessao_id,
      s.data_treino,
      s.volume_total,
      s.total_series,
      st.exercicio,
      COUNT(st.id) AS total_series_exercicio
    FROM sessoes_treino s
    LEFT JOIN series_treino st ON st.sessao_id = s.id
    WHERE s.usuario_id = ?
    GROUP BY 
      s.id,
      s.data_treino,
      s.volume_total,
      s.total_series,
      st.exercicio
    ORDER BY s.id DESC
  `;

  db.query(sql, [usuarioId], (err, result) => {
    if (err) {
      console.error(err);
      return res.status(500).json({
        erro: 'Erro ao buscar sessões de treino'
      });
    }

    const sessoesMap = {};

    result.forEach((linha) => {
      if (!sessoesMap[linha.sessao_id]) {
        sessoesMap[linha.sessao_id] = {
          id: linha.sessao_id,
          data_treino: linha.data_treino,
          volume_total: linha.volume_total,
          total_series: linha.total_series,
          exercicios: []
        };
      }

      if (linha.exercicio) {
        sessoesMap[linha.sessao_id].exercicios.push({
          nome: linha.exercicio,
          total_series: linha.total_series_exercicio
        });
      }
    });

    res.json(Object.values(sessoesMap));
  });
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

const salvarSessaoTreino = (req, res) => {
  const usuarioId = req.user.id;
  const { exercicios, data } = req.body;

  if (!exercicios || exercicios.length === 0) {
    return res.status(400).json({ erro: 'Nenhum exercício enviado' });
  }

  let volumeTotal = 0;
  let totalSeries = 0;

  exercicios.forEach((exercicio) => {
    exercicio.series.forEach((serie) => {
      const carga = Number(serie.carga) || 0;
      const reps = Number(serie.reps) || 0;

      volumeTotal += carga * reps;
      totalSeries += 1;
    });
  });

  const sqlSessao = `
    INSERT INTO sessoes_treino
    (usuario_id, data_treino, volume_total, total_series)
    VALUES (?, ?, ?, ?)
  `;

  db.query(
    sqlSessao,
    [usuarioId, data, volumeTotal, totalSeries],
    (err, result) => {
      if (err) {
        console.error(err);
        return res.status(500).json({ erro: 'Erro ao salvar sessão de treino' });
      }

      const sessaoId = result.insertId;

      const valoresSeries = [];

      exercicios.forEach((exercicio) => {
        exercicio.series.forEach((serie, index) => {
          valoresSeries.push([
            sessaoId,
            exercicio.nome,
            index + 1,
            Number(serie.carga) || 0,
            Number(serie.reps) || 0
          ]);
        });
      });

      const sqlSeries = `
        INSERT INTO series_treino
        (sessao_id, exercicio, numero_serie, carga, repeticoes)
        VALUES ?
      `;

      db.query(sqlSeries, [valoresSeries], (errSeries) => {
        if (errSeries) {
          console.error(errSeries);
          return res.status(500).json({ erro: 'Erro ao salvar séries do treino' });
        }

        res.status(201).json({
          mensagem: 'Sessão de treino salva com sucesso',
          sessaoId,
          volumeTotal,
          totalSeries
        });
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

const deletarSessaoTreino = (req, res) => {
  const usuarioId = req.user.id;
  const { id } = req.params;

  const sql = `
    DELETE FROM sessoes_treino
    WHERE id = ? AND usuario_id = ?
  `;

  db.query(sql, [id, usuarioId], (err, result) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ erro: 'Erro ao deletar sessão de treino' });
    }

    if (result.affectedRows === 0) {
      return res.status(404).json({
        erro: 'Sessão não encontrada ou não pertence a este usuário'
      });
    }

    res.json({ mensagem: 'Sessão de treino deletada' });
  });
};

module.exports = {
  listarTreinos,
  listarSessoesTreino,
  cadastrarTreino,
  salvarSessaoTreino,
  deletarTreino,
  deletarSessaoTreino,
};