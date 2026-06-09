# TrackRep API

API REST do sistema TrackRep, desenvolvida para gerenciamento e acompanhamento de treinos de musculação.

## Descrição

O TrackRep é um sistema desenvolvido como Trabalho de Conclusão de Curso (TCC) do curso de Sistemas de Informação.

A API é responsável por:

- Cadastro e autenticação de usuários
- Gerenciamento de sessões de treino
- Armazenamento de medidas corporais
- Estatísticas de treinamento
- Integração com API externa de exercícios (Wger)
- Controle de acesso utilizando JWT

---

## Tecnologias Utilizadas

### Backend

- Node.js
- Express.js
- MySQL
- JWT (JSON Web Token)
- bcrypt
- CORS

### Banco de Dados

- MySQL

---

## Funcionalidades Implementadas

### Usuários

- Cadastro de usuário
- Login de usuário
- Criptografia de senha com bcrypt
- Exclusão de conta
- Alteração de senha
- Perfil do usuário

### Perfil

- Altura
- Peso
- Peito
- Cintura
- Braço
- Coxa
- Panturrilha

### Treinos

- Criação de sessões de treino
- Cadastro de múltiplos exercícios
- Cadastro de múltiplas séries por exercício
- Cálculo automático de volume total
- Histórico de treinos
- Exclusão de treinos

### Dashboard

- Quantidade de treinos realizados
- Volume total levantado
- Sequência de treinos
- Histórico recente

### API Externa

Integração com a API Wger para consulta de exercícios de musculação.

---

## Rotas Principais

### Autenticação

| Método | Rota | Descrição |
|----------|----------|----------|
| POST | /register | Cadastro |
| POST | /login | Login |
| DELETE | /usuarios/minha-conta | Excluir conta |

---

### Perfil

| Método | Rota | Descrição |
|----------|----------|----------|
| GET | /perfil | Buscar perfil |
| PUT | /perfil | Atualizar perfil |

---

### Treinos

| Método | Rota | Descrição |
|----------|----------|----------|
| GET | /treinos/sessoes | Listar treinos |
| POST | /treinos/sessao | Salvar treino |
| DELETE | /treinos/sessoes/:id | Excluir treino |

---

### API Externa

| Método | Rota | Descrição |
|----------|----------|----------|
| GET | /api/exercicios | Buscar exercícios na API Wger |

---

## Segurança

- Senhas armazenadas utilizando bcrypt
- Autenticação via JWT
- Rotas protegidas por middleware de autenticação

---

## Como Executar

### Instalar dependências

```bash
npm install
```

### Iniciar servidor

```bash
node server.js
```

ou

```bash
npm start
```

### Servidor

```bash
http://localhost:3000
```

---

## Estrutura do Projeto

```text
TrackRep API
│
├── config
│   └── db.js
│
├── controllers
│   ├── authController.js
│   └── treinosController.js
│
├── middlewares
│   └── authMiddleware.js
│
├── routes
│   ├── authRoutes.js
│   └── treinosRoutes.js
│
├── server.js
└── package.json
```

---

## Autor

Fernando Faria Hong

## Orientador

Alessandro Aparecido da Silva Horas

## Projeto Acadêmico

Trabalho de Conclusão de Curso (TCC)

Curso: Sistemas de Informação

Universidade de Mogi das Cruzes (UMC)
