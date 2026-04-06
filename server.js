const express = require('express');
const fs = require('fs');
const app = express();

app.use(express.json());

const FILE = 'treinos.json';

console.log("API iniciando...");
// cria arquivo se não existir
if (!fs.existsSync(FILE)) {
  fs.writeFileSync(FILE, JSON.stringify([]));
}

// GET - listar treinos
app.get('/treinos', (req, res) => {
  const data = JSON.parse(fs.readFileSync(FILE));
  res.json(data);
});

// POST - cadastrar treino
app.post('/treinos', (req, res) => {
  const { exercicio, carga, repeticoes, series, data } = req.body;

  if (!exercicio || !carga || !repeticoes || !series || !data) {
    return res.status(400).json({ erro: 'Preencha todos os campos' });
  }

  const treinos = JSON.parse(fs.readFileSync(FILE));

  const novoTreino = {
    id: Date.now(),
    exercicio,
    carga,
    repeticoes,
    series,
    data
  };

  treinos.push(novoTreino);

  fs.writeFileSync(FILE, JSON.stringify(treinos, null, 2));

  res.status(201).json(novoTreino);
});

// DELETE - apagar treino
app.delete('/treinos/:id', (req, res) => {
  const id = parseInt(req.params.id);

  let treinos = JSON.parse(fs.readFileSync(FILE));

  const novosTreinos = treinos.filter(t => t.id !== id);

  fs.writeFileSync(FILE, JSON.stringify(novosTreinos, null, 2));

  res.json({ mensagem: 'Treino deletado com sucesso' });
});

app.listen(3000, () => {
  console.log('Servidor rodando em http://localhost:3000');
});