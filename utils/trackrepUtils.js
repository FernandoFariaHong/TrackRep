// Formata o e-mail removendo espaços e convertendo para letras minúsculas
const formatarEmail = (email) => {
  if (!email || typeof email !== "string") {
    return "";
  }

  return email.trim().toLowerCase();
};

// Verifica se o usuário pode excluir a própria conta
// Administradores (is_admin = 1) não podem excluir a conta
const podeExcluirConta = (isAdmin) => {
  return Number(isAdmin) !== 1;
};

// Normaliza medidas corporais antes de salvar no banco
// Valores vazios retornam null
const normalizarMedida = (valor) => {
  if (valor === "" || valor === undefined || valor === null) {
    return null;
  }

  return Number(valor);
};

// Verifica se uma senha foi realmente informada
const senhaFoiInformada = (senha) => {
  if (!senha || typeof senha !== "string") {
    return false;
  }

  return senha.trim().length > 0;
};

// Valida se todos os campos obrigatórios do cadastro foram preenchidos
const validarCadastro = (nome, email, senha) => {
  return Boolean(
    nome &&
    nome.trim() &&
    email &&
    email.trim() &&
    senha &&
    senha.trim()
  );
};

module.exports = {
  formatarEmail,
  podeExcluirConta,
  normalizarMedida,
  senhaFoiInformada,
  validarCadastro
};