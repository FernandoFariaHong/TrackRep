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

  try {
    const senhaCriptografada = await bcrypt.hash(senha, 10);

    db.query(
      'INSERT INTO usuarios (nome, email, senha) VALUES (?, ?, ?)',
      [nome, email, senhaCriptografada],
      (err, result) => {
        if (err) {
          console.error(err);
          return res.status(500).json({ erro: 'Erro ao cadastrar usuário' });
        }

        res.status(201).json({ mensagem: 'Usuário cadastrado com sucesso' });
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

  db.query(
    'SELECT * FROM usuarios WHERE email = ?',
    [email],
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
        { id: usuario.id, email: usuario.email },
        SECRET,
        { expiresIn: '1h' }
      );

      res.json({
        mensagem: 'Login realizado com sucesso',
        token
      });
    }
  );
};

module.exports = { register, login };