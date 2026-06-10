const db = require("../config/db");

const adminMiddleware = (req, res, next) => {
  const usuarioId = req.user.id;

  db.query(
    "SELECT is_admin FROM usuarios WHERE id = ?",
    [usuarioId],
    (err, results) => {
      if (err) {
        console.error(err);
        return res.status(500).json({
          erro: "Erro ao verificar permissão de administrador"
        });
      }

      if (results.length === 0) {
        return res.status(404).json({
          erro: "Usuário não encontrado"
        });
      }

      if (results[0].is_admin !== 1) {
        return res.status(403).json({
          erro: "Acesso negado. Apenas administradores podem acessar."
        });
      }

      next();
    }
  );
};

module.exports = adminMiddleware;