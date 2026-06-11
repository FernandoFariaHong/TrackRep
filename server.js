require("dotenv").config();

const express = require('express');
const cors = require('cors');
const treinosRoutes = require('./routes/treinosRoutes');
const authRoutes = require('./routes/authRoutes');
const adminRoutes = require("./routes/adminRoutes");
console.log("IMPORT ADMIN ROUTES OK");



const app = express();

app.use(cors({
  origin: 'http://localhost:5173',
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());

console.log('API iniciando...');

app.use(authRoutes);
app.use('/', treinosRoutes);
app.use('/admin', adminRoutes);

app.listen(3000, () => {
  console.log('Servidor rodando em http://localhost:3000');
});