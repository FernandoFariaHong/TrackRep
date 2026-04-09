CREATE DATABASE trackrep;

USE trackrep;

CREATE TABLE treinos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    exercicio VARCHAR(100),
    carga DECIMAL(10,2),
    repeticoes INT,
    series INT,
    data_treino DATE
);