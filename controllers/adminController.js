const db = require("../config/db");

const dashboard = (req, res) => {
  const { dataInicio, dataFim } = req.query;

  let filtroData = "";
  const params = [];

  if (dataInicio && dataFim) {
    filtroData = "WHERE DATE(data_treino) BETWEEN ? AND ?";
    params.push(dataInicio, dataFim);
  }

  db.query(
    `
    SELECT
      (SELECT COUNT(*) FROM usuarios) AS totalUsuarios,
      (SELECT COUNT(*) FROM sessoes_treino ${filtroData}) AS totalTreinos,
      (SELECT COUNT(*) FROM sessoes_treino WHERE DATE(data_treino) = CURDATE()) AS treinosHoje,
      (SELECT IFNULL(SUM(volume_total), 0) FROM sessoes_treino ${filtroData}) AS volumeTotal
    `,
    [...params, ...params],
    (err, result) => {
      if (err) {
        console.error(err);
        return res.status(500).json({ erro: "Erro ao buscar dados gerais" });
      }

      db.query(
        `
        SELECT id, nome, email
        FROM usuarios
        ORDER BY id DESC
        `,
        (err2, usuarios) => {
          if (err2) {
            console.error(err2);
            return res.status(500).json({ erro: "Erro ao buscar usuários" });
          }

          db.query(
            `
            SELECT
              s.id,
              u.nome,
              s.data_treino,
              s.volume_total,
              s.total_series
            FROM sessoes_treino s
            JOIN usuarios u ON s.usuario_id = u.id
            ${filtroData ? "WHERE DATE(s.data_treino) BETWEEN ? AND ?" : ""}
            ORDER BY s.id DESC
            LIMIT 10
            `,
            params,
            (err3, treinos) => {
              if (err3) {
                console.error(err3);
                return res.status(500).json({ erro: "Erro ao buscar treinos" });
              }

              res.json({
                totalUsuarios: result[0].totalUsuarios,
                totalTreinos: result[0].totalTreinos,
                treinosHoje: result[0].treinosHoje,
                volumeTotal: result[0].volumeTotal,
                usuarios,
                treinos,
              });
            }
          );
        }
      );
    }
  );
};

const excluirUsuario = (req, res) => {
  const adminId = Number(req.user.id);
  const usuarioId = Number(req.params.id);

  // Não permite excluir a própria conta
  if (usuarioId === adminId) {
    return res.status(400).json({
      erro: "Você não pode excluir sua própria conta pelo painel administrativo."
    });
  }

  // Verifica se o usuário é administrador
  db.query(
    "SELECT is_admin FROM usuarios WHERE id = ?",
    [usuarioId],
    (err, results) => {
      if (err) {
        console.error(err);
        return res.status(500).json({
          erro: "Erro ao verificar usuário."
        });
      }

      if (results.length === 0) {
        return res.status(404).json({
          erro: "Usuário não encontrado."
        });
      }

      // BLOQUEIA exclusão de qualquer administrador
      if (Number(results[0].is_admin) === 1) {
        return res.status(403).json({
          erro: "Contas de administrador não podem ser excluídas pelo painel."
        });
      }

      // Exclui séries
      db.query(
        "DELETE FROM series_treino WHERE sessao_id IN (SELECT id FROM sessoes_treino WHERE usuario_id = ?)",
        [usuarioId],
        (err) => {
          if (err) {
            console.error(err);
            return res.status(500).json({
              erro: "Erro ao excluir séries."
            });
          }

          // Exclui sessões
          db.query(
            "DELETE FROM sessoes_treino WHERE usuario_id = ?",
            [usuarioId],
            (err2) => {
              if (err2) {
                console.error(err2);
                return res.status(500).json({
                  erro: "Erro ao excluir sessões."
                });
              }

              // Exclui treinos
              db.query(
                "DELETE FROM treinos WHERE usuario_id = ?",
                [usuarioId],
                (err3) => {
                  if (err3) {
                    console.error(err3);
                    return res.status(500).json({
                      erro: "Erro ao excluir treinos."
                    });
                  }

                  // Exclui usuário
                  db.query(
                    "DELETE FROM usuarios WHERE id = ?",
                    [usuarioId],
                    (err4, result) => {
                      if (err4) {
                        console.error(err4);
                        return res.status(500).json({
                          erro: "Erro ao excluir usuário."
                        });
                      }

                      if (result.affectedRows === 0) {
                        return res.status(404).json({
                          erro: "Usuário não encontrado."
                        });
                      }

                      return res.json({
                        mensagem: "Usuário excluído com sucesso."
                      });
                    }
                  );
                }
              );
            }
          );
        }
      );
    }
  );
};

module.exports = {
  dashboard,
  excluirUsuario
};