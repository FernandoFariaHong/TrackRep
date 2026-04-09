const express = require('express');
const treinosRoutes = require('./routes/treinosRoutes');

const app = express();

app.use(express.json());

console.log('API iniciando...');

app.use('/', treinosRoutes);

app.listen(3000, () => {
  console.log('Servidor rodando em http://localhost:3000');
});