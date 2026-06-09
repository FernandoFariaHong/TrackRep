const db = require('../config/db');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const SECRET = 'segredo_super_secreto';

// Cadastro do usuário
const register = async (req, res) => {
  const { nome, email, senha } = req.body;

  if (!nome || !email || !senha) {
    return res.status(400).json({ erro: 'Preencha todos os campos' });
  }

  const nomeFormatado = nome.trim();
  const emailFormatado = email.trim().toLowerCase();

  try {
    const senhaCriptografada = await bcrypt.hash(senha, 10);

    db.query(
      'INSERT INTO usuarios (nome, email, senha) VALUES (?, ?, ?)',
      [nomeFormatado, emailFormatado, senhaCriptografada],
      (err) => {
        if (err) {
          console.error(err);

          if (err.code === 'ER_DUP_ENTRY') {
            return res.status(409).json({
              erro: 'Este e-mail já está cadastrado'
            });
          }

          return res.status(500).json({
            erro: 'Erro ao cadastrar usuário'
          });
        }

        res.status(201).json({
          mensagem: 'Usuário cadastrado com sucesso'
        });
      }
    );
  } catch (error) {
    res.status(500).json({ erro: 'Erro interno' });
  }
};

// Login do usuário
const login = (req, res) => {
  const { email, senha } = req.body;

  if (!email || !senha) {
    return res.status(400).json({ erro: 'Preencha todos os campos' });
  }

  const emailFormatado = email.trim().toLowerCase();

  db.query(
    'SELECT * FROM usuarios WHERE email = ?',
    [emailFormatado],
    async (err, results) => {
      if (err) {
        console.error(err);
        return res.status(500).json({ erro: 'Erro no servidor' });
      }

      if (results.length === 0) {
        return res.status(401).json({ erro: 'Usuário não encontrado' });
      }

      const usuario = results[0];

      const senhaValida = await bcrypt.compare(senha, usuario.senha);

      if (!senhaValida) {
        return res.status(401).json({ erro: 'Senha incorreta' });
      }

      const token = jwt.sign(
        {
          id: usuario.id,
          email: usuario.email
        },
        SECRET,
        {
          expiresIn: '1h'
        }
      );

      res.json({
        mensagem: 'Login realizado com sucesso',
        token,
        usuario: {
          id: usuario.id,
          nome: usuario.nome,
          email: usuario.email
        }
      });
    }
  );
};

// Buscar perfil do usuário
const buscarPerfil = (req, res) => {
  const usuarioId = req.user.id;

  db.query(
    `SELECT
      nome,
      email,
      altura,
      peso,
      peito,
      cintura,
      braco,
      coxa,
      panturrilha
     FROM usuarios
     WHERE id = ?`,
    [usuarioId],
    (err, results) => {
      if (err) {
        console.error(err);
        return res.status(500).json({
          erro: 'Erro ao buscar perfil'
        });
      }

      if (results.length === 0) {
        return res.status(404).json({
          erro: 'Usuário não encontrado'
        });
      }

      res.json(results[0]);
    }
  );
};

// Atualizar perfil do usuário
const atualizarPerfil = (req, res) => {
  const usuarioId = req.user.id;

  const {
    altura,
    peso,
    peito,
    cintura,
    braco,
    coxa,
    panturrilha
  } = req.body;

  db.query(
    `UPDATE usuarios
     SET
      altura = ?,
      peso = ?,
      peito = ?,
      cintura = ?,
      braco = ?,
      coxa = ?,
      panturrilha = ?
     WHERE id = ?`,
    [
      altura || null,
      peso || null,
      peito || null,
      cintura || null,
      braco || null,
      coxa || null,
      panturrilha || null,
      usuarioId
    ],
    (err) => {
      if (err) {
        console.error(err);
        return res.status(500).json({
          erro: 'Erro ao atualizar perfil'
        });
      }

      res.json({
        mensagem: 'Perfil atualizado com sucesso'
      });
    }
  );
};

// Buscar exercícios em API externa
const buscarExerciciosExternos = async (req, res) => {
  const { busca } = req.query;

  if (!busca || !busca.trim()) {
    return res.status(400).json({
      erro: 'Informe o nome do exercício'
    });
  }

  try {
    const response = await fetch(
      `https://wger.de/api/v2/exerciseinfo/?language=2&limit=50&term=${encodeURIComponent(busca)}`
    );

    if (!response.ok) {
      return res.status(502).json({
        erro: 'Erro na resposta da API externa'
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

        const nome =
          traducaoComNome?.name ||
          'Nome não informado';

        const descricao =
          traducaoComDescricao?.description
            ? traducaoComDescricao.description.replace(/<[^>]*>?/gm, '')
            : 'Sem descrição disponível.';

        const categoria =
          {
            Cardio: 'Cardio',
            Legs: 'Pernas',
            Chest: 'Peito',
            Back: 'Costas',
            Shoulders: 'Ombros',
            Arms: 'Braços',
            Abs: 'Abdômen',
            Calves: 'Panturrilhas'
          }[exercicio.category?.name] ||
          exercicio.category?.name ||
          'Não informada';

        const musculos =
          exercicio.muscles
            ?.map(
              (musculo) =>
                ({
                  'Quadriceps femoris': 'Quadríceps',
                  'Pectoralis major': 'Peitoral maior',
                  'Anterior deltoid': 'Deltoide anterior',
                  Biceps: 'Bíceps',
                  Triceps: 'Tríceps',
                  'Latissimus dorsi': 'Dorsal',
                  Glutes: 'Glúteos',
                  Hamstrings: 'Posterior de coxa',
                  Gastrocnemius: 'Panturrilha',
                  Abdominals: 'Abdômen'
                }[musculo.name] || musculo.name)
            )
            .join(', ') || 'Não informado';

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
          imagem
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
      fonte: 'API externa wger',
      total: resultados.length,
      resultados
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      erro: 'A API externa demorou para responder. Tente novamente em alguns segundos.'
    });
  }
};

// Excluir conta e todos os treinos do usuário
const excluirConta = (req, res) => {
  const usuarioId = req.user.id;

  db.query(
    'DELETE FROM treinos WHERE usuario_id = ?',
    [usuarioId],
    (err) => {
      if (err) {
        console.error(err);
        return res.status(500).json({
          erro: 'Erro ao excluir treinos do usuário'
        });
      }

      db.query(
        'DELETE FROM usuarios WHERE id = ?',
        [usuarioId],
        (err, result) => {
          if (err) {
            console.error(err);
            return res.status(500).json({
              erro: 'Erro ao excluir conta'
            });
          }

          if (result.affectedRows === 0) {
            return res.status(404).json({
              erro: 'Usuário não encontrado'
            });
          }

          res.json({
            mensagem: 'Conta e treinos excluídos com sucesso'
          });
        }
      );
    }
  );
};

// Alterar senha do usuário
const alterarSenha = async (req, res) => {
  const usuarioId = req.user.id;
  const { novaSenha } = req.body;

  if (!novaSenha) {
    return res.status(400).json({
      erro: 'Informe a nova senha'
    });
  }

  try {
    const senhaCriptografada = await bcrypt.hash(novaSenha, 10);

    db.query(
      'UPDATE usuarios SET senha = ? WHERE id = ?',
      [senhaCriptografada, usuarioId],
      (err, result) => {
        if (err) {
          console.error(err);
          return res.status(500).json({
            erro: 'Erro ao alterar senha'
          });
        }

        if (result.affectedRows === 0) {
          return res.status(404).json({
            erro: 'Usuário não encontrado'
          });
        }

        res.json({
          mensagem: 'Senha alterada com sucesso'
        });
      }
    );
  } catch (error) {
    res.status(500).json({
      erro: 'Erro interno ao alterar senha'
    });
  }
};

module.exports = {
  register,
  login,
  buscarPerfil,
  atualizarPerfil,
  alterarSenha,
  excluirConta,
  buscarExerciciosExternos
};