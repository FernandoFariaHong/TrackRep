const express = require('express');
const cors = require('cors');
const treinosRoutes = require('./routes/treinosRoutes');
const authRoutes = require('./routes/authRoutes');

const app = express();

app.use(cors());
app.use(express.json());

console.log('API iniciando...');

app.use(authRoutes);
app.use('/', treinosRoutes);

app.listen(3000, () => {
  console.log('Servidor rodando em http://localhost:3000');
});