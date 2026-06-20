-- =========================================================
-- BANCO DE DADOS TRACKREP
-- Script completo atualizado para correções pós-banca
-- =========================================================

DROP DATABASE IF EXISTS trackrep;
CREATE DATABASE trackrep;
USE trackrep;

-- =========================================================
-- TABELA: usuarios
-- Armazena dados de cadastro, login, permissões e medidas atuais
-- =========================================================

CREATE TABLE usuarios (
    id INT AUTO_INCREMENT PRIMARY KEY,

    nome VARCHAR(100) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    senha VARCHAR(255) NOT NULL,

    -- 0 = usuário comum | 1 = administrador
    is_admin TINYINT(1) DEFAULT 0,

    -- Medidas corporais atuais do usuário
    altura DECIMAL(5,2) NULL,
    peso DECIMAL(5,2) NULL,
    peito DECIMAL(5,2) NULL,
    cintura DECIMAL(5,2) NULL,
    braco DECIMAL(5,2) NULL,
    coxa DECIMAL(5,2) NULL,
    panturrilha DECIMAL(5,2) NULL,

    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =========================================================
-- TABELA: historico_corporal
-- Armazena a evolução corporal do usuário ao longo do tempo
-- Cada vez que o usuário salvar medidas, um novo registro será criado
-- =========================================================

CREATE TABLE historico_corporal (
    id INT AUTO_INCREMENT PRIMARY KEY,

    usuario_id INT NOT NULL,

    peso DECIMAL(5,2) NULL,
    altura DECIMAL(5,2) NULL,
    imc DECIMAL(5,2) NULL,

    peito DECIMAL(5,2) NULL,
    cintura DECIMAL(5,2) NULL,
    braco DECIMAL(5,2) NULL,
    coxa DECIMAL(5,2) NULL,
    panturrilha DECIMAL(5,2) NULL,

    data_registro TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (usuario_id)
    REFERENCES usuarios(id)
    ON DELETE CASCADE
);

-- =========================================================
-- TABELA: treinos
-- Tabela de treinos simples/antigos
-- Mantida para compatibilidade com funcionalidades anteriores
-- =========================================================

CREATE TABLE treinos (
    id INT AUTO_INCREMENT PRIMARY KEY,

    usuario_id INT NOT NULL,

    exercicio VARCHAR(100) NOT NULL,
    carga DECIMAL(10,2) DEFAULT 0,
    repeticoes INT DEFAULT 0,
    series INT DEFAULT 0,
    data_treino DATE,

    FOREIGN KEY (usuario_id)
    REFERENCES usuarios(id)
    ON DELETE CASCADE
);

-- =========================================================
-- TABELA: sessoes_treino
-- Representa uma sessão completa de treino do usuário
-- Exemplo: treino realizado em determinada data com várias séries
-- =========================================================

CREATE TABLE sessoes_treino (
    id INT AUTO_INCREMENT PRIMARY KEY,

    usuario_id INT NOT NULL,

    data_treino DATE,
    total_series INT DEFAULT 0,

    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (usuario_id)
    REFERENCES usuarios(id)
    ON DELETE CASCADE
);

-- =========================================================
-- TABELA: series_treino
-- Armazena cada série realizada dentro de uma sessão de treino
-- =========================================================

CREATE TABLE series_treino (
    id INT AUTO_INCREMENT PRIMARY KEY,

    sessao_id INT NOT NULL,

    exercicio VARCHAR(100) NOT NULL,
    numero_serie INT NOT NULL,

    carga DECIMAL(10,2) NOT NULL,
    repeticoes INT NOT NULL,

    FOREIGN KEY (sessao_id)
    REFERENCES sessoes_treino(id)
    ON DELETE CASCADE
);

-- =========================================================
-- CONSULTAS ÚTEIS PARA DEMONSTRAÇÃO NA BANCA
-- =========================================================

-- Mostra todas as tabelas do banco
SHOW TABLES;

-- Mostra todos os usuários cadastrados
SELECT * FROM usuarios;

-- Mostra usuários com tipo de perfil
SELECT
    id,
    nome,
    email,
    CASE
        WHEN is_admin = 1 THEN 'Administrador'
        ELSE 'Usuário comum'
    END AS tipo_usuario,
    criado_em
FROM usuarios
ORDER BY id DESC;

-- Mostra o histórico corporal completo
SELECT * FROM historico_corporal;

-- Mostra histórico corporal com nome do usuário
SELECT
    u.nome,
    h.peso,
    h.altura,
    h.imc,
    h.peito,
    h.cintura,
    h.braco,
    h.coxa,
    h.panturrilha,
    h.data_registro
FROM historico_corporal h
INNER JOIN usuarios u ON h.usuario_id = u.id
ORDER BY h.data_registro DESC;

-- Mostra todas as sessões de treino
SELECT * FROM sessoes_treino;

-- Mostra todas as séries registradas
SELECT * FROM series_treino;

-- Mostra treino completo com usuário, exercício, carga e repetições
SELECT
    u.nome AS usuario,
    s.id AS sessao_id,
    s.data_treino,
    st.exercicio,
    st.numero_serie,
    st.carga,
    st.repeticoes,
    s.total_series
FROM sessoes_treino s
INNER JOIN usuarios u ON s.usuario_id = u.id
INNER JOIN series_treino st ON st.sessao_id = s.id
ORDER BY s.id DESC, st.numero_serie ASC;

-- Conta total de usuários
SELECT COUNT(*) AS total_usuarios
FROM usuarios;

-- Conta total de treinos registrados
SELECT COUNT(*) AS total_treinos
FROM sessoes_treino;

-- Conta total de registros corporais
SELECT COUNT(*) AS total_registros_corporais
FROM historico_corporal;