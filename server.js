// Carrega as variáveis de ambiente do arquivo .env
require("dotenv").config();

const express = require("express");
const cors = require("cors");

// Importação das rotas da aplicação
const treinosRoutes = require("./routes/treinosRoutes");
const authRoutes = require("./routes/authRoutes");
const adminRoutes = require("./routes/adminRoutes");

console.log("IMPORT ADMIN ROUTES OK");

// Inicializa a aplicação Express
const app = express();

// Configuração do CORS para permitir requisições do frontend
app.use(
  cors({
    origin: "http://localhost:5173",
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

// Permite que a API receba requisições em formato JSON
app.use(express.json());

console.log("API iniciando...");

// Registro das rotas da aplicação
app.use(authRoutes);
app.use("/", treinosRoutes);
app.use("/admin", adminRoutes);

// Obtém a porta através da variável de ambiente, caso ela não exista, utiliza a porta 3000 como padrão.
const PORT = process.env.PORT || 3000;

// Inicializa o servidor
app.listen(PORT, () => {
  console.log(`Servidor rodando em http://localhost:${PORT}`);
});