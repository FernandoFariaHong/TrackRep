require("dotenv").config();

const db = require("../config/db");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

// ======================================================
// FUNÇÕES AUXILIARES
// ======================================================

// Converte campos vazios para NULL antes de salvar no banco
const valorOuNull = (valor) => {
  return valor === "" || valor === undefined || valor === null ? null : valor;
};

// Calcula o IMC quando peso e altura forem informados
const calcularImc = (peso, altura) => {
  const pesoNumber = Number(peso);
  const alturaNumber = Number(altura);

  if (!pesoNumber || !alturaNumber || alturaNumber <= 0) {
    return null;
  }

  return Number((pesoNumber / (alturaNumber * alturaNumber)).toFixed(2));
};

// ======================================================
// CADASTRO DO USUÁRIO
// ======================================================

const register = async (req, res) => {
  const { nome, email, senha } = req.body;

  if (!nome || !email || !senha) {
    return res.status(400).json({ erro: "Preencha todos os campos" });
  }

  const nomeFormatado = nome.trim();
  const emailFormatado = email.trim().toLowerCase();

  try {
    const senhaCriptografada = await bcrypt.hash(senha, 10);

    db.query(
      "INSERT INTO usuarios (nome, email, senha) VALUES (?, ?, ?)",
      [nomeFormatado, emailFormatado, senhaCriptografada],
      (err) => {
        if (err) {
          console.error(err);

          if (err.code === "ER_DUP_ENTRY") {
            return res.status(409).json({
              erro: "Este e-mail já está cadastrado",
            });
          }

          return res.status(500).json({
            erro: "Erro ao cadastrar usuário",
          });
        }

        res.status(201).json({
          mensagem: "Usuário cadastrado com sucesso",
        });
      }
    );
  } catch (error) {
    console.error(error);
    res.status(500).json({ erro: "Erro interno" });
  }
};

// ======================================================
// LOGIN DO USUÁRIO
// ======================================================

const login = (req, res) => {
  const { email, senha } = req.body;

  if (!email || !senha) {
    return res.status(400).json({ erro: "Preencha todos os campos" });
  }

  const emailFormatado = email.trim().toLowerCase();

  db.query(
    "SELECT * FROM usuarios WHERE email = ?",
    [emailFormatado],
    async (err, results) => {
      if (err) {
        console.error(err);
        return res.status(500).json({ erro: "Erro no servidor" });
      }

      if (results.length === 0) {
        return res.status(401).json({ erro: "Usuário não encontrado" });
      }

      const usuario = results[0];

      const senhaValida = await bcrypt.compare(senha, usuario.senha);

      if (!senhaValida) {
        return res.status(401).json({ erro: "Senha incorreta" });
      }

      const token = jwt.sign(
        {
          id: usuario.id,
          email: usuario.email,
        },
        process.env.JWT_SECRET,
        {
          expiresIn: "1h",
        }
      );

      res.json({
        mensagem: "Login realizado com sucesso",
        token,
        usuario: {
          id: usuario.id,
          nome: usuario.nome,
          email: usuario.email,
          is_admin: usuario.is_admin,
        },
      });
    }
  );
};

// ======================================================
// BUSCAR PERFIL ATUAL DO USUÁRIO
// Agora também retorna objetivo corporal, peso meta e data da meta
// ======================================================

const buscarPerfil = (req, res) => {
  const usuarioId = req.user.id;

  db.query(
    `
    SELECT
      nome,
      email,
      altura,
      peso,
      peito,
      cintura,
      braco,
      coxa,
      panturrilha,
      objetivo_corporal,
      peso_meta,
      data_meta
    FROM usuarios
    WHERE id = ?
    `,
    [usuarioId],
    (err, results) => {
      if (err) {
        console.error(err);
        return res.status(500).json({
          erro: "Erro ao buscar perfil",
        });
      }

      if (results.length === 0) {
        return res.status(404).json({
          erro: "Usuário não encontrado",
        });
      }

      res.json(results[0]);
    }
  );
};

// ======================================================
// ATUALIZAR PERFIL, META CORPORAL E HISTÓRICO CORPORAL
// ======================================================

const atualizarPerfil = (req, res) => {
  const usuarioId = req.user.id;

  const {
    altura,
    peso,
    peito,
    cintura,
    braco,
    coxa,
    panturrilha,
    objetivo_corporal,
    peso_meta,
    data_meta,
  } = req.body;

  const alturaFinal = valorOuNull(altura);
  const pesoFinal = valorOuNull(peso);
  const peitoFinal = valorOuNull(peito);
  const cinturaFinal = valorOuNull(cintura);
  const bracoFinal = valorOuNull(braco);
  const coxaFinal = valorOuNull(coxa);
  const panturrilhaFinal = valorOuNull(panturrilha);

  const objetivoFinal = objetivo_corporal || "manter_peso";
  const pesoMetaFinal = valorOuNull(peso_meta);
  const dataMetaFinal = valorOuNull(data_meta);

  const imc = calcularImc(pesoFinal, alturaFinal);

  const sqlAtualizarUsuario = `
    UPDATE usuarios
    SET
      altura = ?,
      peso = ?,
      peito = ?,
      cintura = ?,
      braco = ?,
      coxa = ?,
      panturrilha = ?,
      objetivo_corporal = ?,
      peso_meta = ?,
      data_meta = ?
    WHERE id = ?
  `;

  db.query(
    sqlAtualizarUsuario,
    [
      alturaFinal,
      pesoFinal,
      peitoFinal,
      cinturaFinal,
      bracoFinal,
      coxaFinal,
      panturrilhaFinal,
      objetivoFinal,
      pesoMetaFinal,
      dataMetaFinal,
      usuarioId,
    ],
    (err, result) => {
      if (err) {
        console.error(err);
        return res.status(500).json({
          erro: "Erro ao atualizar perfil",
        });
      }

      if (result.affectedRows === 0) {
        return res.status(404).json({
          erro: "Usuário não encontrado",
        });
      }

      const sqlHistorico = `
        INSERT INTO historico_corporal
        (
          usuario_id,
          peso,
          altura,
          imc,
          peito,
          cintura,
          braco,
          coxa,
          panturrilha
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;

      db.query(
        sqlHistorico,
        [
          usuarioId,
          pesoFinal,
          alturaFinal,
          imc,
          peitoFinal,
          cinturaFinal,
          bracoFinal,
          coxaFinal,
          panturrilhaFinal,
        ],
        (errHistorico) => {
          if (errHistorico) {
            console.error(errHistorico);
            return res.status(500).json({
              erro:
                "Perfil atualizado, mas houve erro ao salvar histórico corporal",
            });
          }

          res.json({
            mensagem:
              "Perfil atualizado, meta corporal e histórico registrados com sucesso",
            imc,
          });
        }
      );
    }
  );
};

// ======================================================
// BUSCAR HISTÓRICO CORPORAL DO USUÁRIO
// Retorna todos os registros para análise da evolução física
// ======================================================

const buscarHistoricoCorporal = (req, res) => {
  const usuarioId = req.user.id;

  const sql = `
    SELECT
      id,
      peso,
      altura,
      imc,
      peito,
      cintura,
      braco,
      coxa,
      panturrilha,
      data_registro
    FROM historico_corporal
    WHERE usuario_id = ?
    ORDER BY data_registro DESC
  `;

  db.query(sql, [usuarioId], (err, results) => {
    if (err) {
      console.error(err);
      return res.status(500).json({
        erro: "Erro ao buscar histórico corporal",
      });
    }

    res.json(results);
  });
};

// ======================================================
// BUSCAR EXERCÍCIOS NA API EXTERNA WGER
// ======================================================

const buscarExerciciosExternos = async (req, res) => {
  const { busca } = req.query;

  if (!busca || !busca.trim()) {
    return res.status(400).json({
      erro: "Informe o nome do exercício",
    });
  }

  try {
    const response = await fetch(
      `https://wger.de/api/v2/exerciseinfo/?language=2&limit=50&term=${encodeURIComponent(
        busca
      )}`
    );

    if (!response.ok) {
      return res.status(502).json({
        erro: "Erro na resposta da API externa",
      });
    }

    const data = await response.json();
    const termo = busca.trim().toLowerCase();

    const resultados = (data.results || [])
      .map((exercicio) => {
        const traducaoIngles =
          exercicio.translations?.find((t) => t.language === 2) || null;

        const traducaoComNome =
          traducaoIngles ||
          exercicio.translations?.find((t) => t.name) ||
          null;

        const traducaoComDescricao =
          traducaoIngles ||
          exercicio.translations?.find((t) => t.description) ||
          null;

        const nome = traducaoComNome?.name || "Nome não informado";

        const descricao = traducaoComDescricao?.description
          ? traducaoComDescricao.description.replace(/<[^>]*>?/gm, "")
          : "Sem descrição disponível.";

        const categoria =
          {
            Cardio: "Cardio",
            Legs: "Pernas",
            Chest: "Peito",
            Back: "Costas",
            Shoulders: "Ombros",
            Arms: "Braços",
            Abs: "Abdômen",
            Calves: "Panturrilhas",
          }[exercicio.category?.name] ||
          exercicio.category?.name ||
          "Não informada";
        const musculos =
          exercicio.muscles
            ?.map(
              (musculo) =>
              ({
                "Quadriceps femoris": "Quadríceps",
                "Pectoralis major": "Peitoral maior",
                "Anterior deltoid": "Deltoide anterior",
                Biceps: "Bíceps",
                Triceps: "Tríceps",
                "Latissimus dorsi": "Dorsal",
                Glutes: "Glúteos",
                Hamstrings: "Posterior de coxa",
                Gastrocnemius: "Panturrilha",
                Abdominals: "Abdômen",
              }[musculo.name] || musculo.name)
            )
            .join(", ") || "Não informado";

        const imagem =
          exercicio.images?.find((img) => img.image)?.image ||
          exercicio.images?.[0]?.image ||
          null;

        return {
          id: exercicio.id,
          nome,
          descricao,
          categoria,
          musculos,
          imagem,
        };
      })
      .filter((exercicio) => {
        return (
          exercicio.nome.toLowerCase().includes(termo) ||
          exercicio.descricao.toLowerCase().includes(termo) ||
          exercicio.categoria.toLowerCase().includes(termo) ||
          exercicio.musculos.toLowerCase().includes(termo)
        );
      });

    res.json({
      fonte: "API externa Wger",
      total: resultados.length,
      resultados,
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      erro:
        "A API externa demorou para responder. Tente novamente em alguns segundos.",
    });
  }
};

// ======================================================
// EXCLUIR CONTA
// ======================================================

const excluirConta = (req, res) => {
  const usuarioId = req.user.id;

  db.query(
    "SELECT is_admin FROM usuarios WHERE id = ?",
    [usuarioId],
    (err, results) => {
      if (err) {
        console.error(err);
        return res.status(500).json({
          erro: "Erro ao verificar usuário",
        });
      }

      if (results.length === 0) {
        return res.status(404).json({
          erro: "Usuário não encontrado",
        });
      }

      if (Number(results[0].is_admin) === 1) {
        return res.status(403).json({
          erro: "Administradores não podem excluir a própria conta.",
        });
      }

      db.query(
        "DELETE FROM usuarios WHERE id = ?",
        [usuarioId],
        (errDelete, result) => {
          if (errDelete) {
            console.error(errDelete);
            return res.status(500).json({
              erro: "Erro ao excluir conta",
            });
          }

          if (result.affectedRows === 0) {
            return res.status(404).json({
              erro: "Usuário não encontrado",
            });
          }

          res.json({
            mensagem:
              "Conta e todos os dados vinculados foram excluídos com sucesso",
          });
        }
      );
    }
  );
};

// ======================================================
// ALTERAR SENHA
// ======================================================

const alterarSenha = async (req, res) => {
  const usuarioId = req.user.id;
  const { novaSenha } = req.body;

  if (!novaSenha) {
    return res.status(400).json({
      erro: "Informe a nova senha",
    });
  }

  try {
    const senhaCriptografada = await bcrypt.hash(novaSenha, 10);

    db.query(
      "UPDATE usuarios SET senha = ? WHERE id = ?",
      [senhaCriptografada, usuarioId],
      (err, result) => {
        if (err) {
          console.error(err);
          return res.status(500).json({
            erro: "Erro ao alterar senha",
          });
        }

        if (result.affectedRows === 0) {
          return res.status(404).json({
            erro: "Usuário não encontrado",
          });
        }

        res.json({
          mensagem: "Senha alterada com sucesso",
        });
      }
    );
  } catch (error) {
    res.status(500).json({
      erro: "Erro interno ao alterar senha",
    });
  }
};

// ======================================================
// ALTERAR E-MAIL
// ======================================================

const alterarEmail = (req, res) => {
  const usuarioId = req.user.id;
  const { novoEmail } = req.body;

  if (!novoEmail) {
    return res.status(400).json({
      erro: "Informe o novo e-mail",
    });
  }

  const emailFormatado = novoEmail.trim().toLowerCase();

  db.query(
    "SELECT id FROM usuarios WHERE email = ? AND id <> ?",
    [emailFormatado, usuarioId],
    (err, results) => {
      if (err) {
        console.error(err);
        return res.status(500).json({
          erro: "Erro ao verificar e-mail",
        });
      }

      if (results.length > 0) {
        return res.status(409).json({
          erro: "Este e-mail já está em uso",
        });
      }

      db.query(
        "UPDATE usuarios SET email = ? WHERE id = ?",
        [emailFormatado, usuarioId],
        (err2, result) => {
          if (err2) {
            console.error(err2);
            return res.status(500).json({
              erro: "Erro ao alterar e-mail",
            });
          }

          if (result.affectedRows === 0) {
            return res.status(404).json({
              erro: "Usuário não encontrado",
            });
          }

          res.json({
            mensagem: "E-mail alterado com sucesso",
            email: emailFormatado,
          });
        }
      );
    }
  );
};

// ======================================================
// EXPORTAÇÕES
// ======================================================

module.exports = {
  register,
  login,
  buscarPerfil,
  atualizarPerfil,
  buscarHistoricoCorporal,
  alterarSenha,
  alterarEmail,
  excluirConta,
  buscarExerciciosExternos,
};