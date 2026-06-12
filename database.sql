DROP DATABASE IF EXISTS trackrep;
CREATE DATABASE trackrep;
USE trackrep;

CREATE TABLE usuarios (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(100) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    senha VARCHAR(255) NOT NULL,
    is_admin TINYINT(1) DEFAULT 0,

    altura DECIMAL(5,2) NULL,
    peso DECIMAL(5,2) NULL,
    peito DECIMAL(5,2) NULL,
    cintura DECIMAL(5,2) NULL,
    braco DECIMAL(5,2) NULL,
    coxa DECIMAL(5,2) NULL,
    panturrilha DECIMAL(5,2) NULL,

    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE treinos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    usuario_id INT NOT NULL,
    exercicio VARCHAR(100) NOT NULL,
    carga DECIMAL(10,2) DEFAULT 0,
    repeticoes INT DEFAULT 0,
    series INT DEFAULT 0,
    data_treino DATE,

    FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
    ON DELETE CASCADE
);

CREATE TABLE sessoes_treino (
    id INT AUTO_INCREMENT PRIMARY KEY,
    usuario_id INT NOT NULL,
    data_treino DATE,
    volume_total DECIMAL(10,2) DEFAULT 0,
    total_series INT DEFAULT 0,
    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
    ON DELETE CASCADE
);

CREATE TABLE series_treino (
    id INT AUTO_INCREMENT PRIMARY KEY,
    sessao_id INT NOT NULL,
    exercicio VARCHAR(100) NOT NULL,
    numero_serie INT NOT NULL,
    carga DECIMAL(10,2) DEFAULT 0,
    repeticoes INT DEFAULT 0,

    FOREIGN KEY (sessao_id) REFERENCES sessoes_treino(id)
    ON DELETE CASCADE
);