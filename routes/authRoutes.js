const express = require("express");
const router = express.Router();

const authMiddleware = require("../middlewares/authMiddleware");

const {
  register,
  login,
  buscarPerfil,
  atualizarPerfil,
  alterarSenha,
  alterarEmail,
  excluirConta,
  buscarExerciciosExternos,
} = require("../controllers/authController");

// Cadastro
router.post("/register", register);

// Login
router.post("/login", login);

// Buscar perfil do usuário
router.get("/perfil", authMiddleware, buscarPerfil);

// Atualizar perfil do usuário
router.put("/perfil", authMiddleware, atualizarPerfil);

// Buscar exercícios em API externa
router.get(
  "/api/exercicios",
  authMiddleware,
  buscarExerciciosExternos
);

// Alterar senha do usuário
router.put(
  "/usuarios/alterar-senha",
  authMiddleware,
  alterarSenha
);

// Alterar e-mail do usuário
router.put(
  "/usuarios/alterar-email",
  authMiddleware,
  alterarEmail
);

// Excluir conta
router.delete(
  "/usuarios/minha-conta",
  authMiddleware,
  excluirConta
);

module.exports = router;