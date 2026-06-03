-- Script de Criação do Banco de Dados NTPBDados
-- Data: 02/06/2026

-- 1. Criação das Tabelas
CREATE TABLE IF NOT EXISTS categorias (
    id SERIAL PRIMARY KEY,
    nome VARCHAR(100) NOT NULL UNIQUE,
    descricao TEXT
);

CREATE TABLE IF NOT EXISTS produtos (
    id SERIAL PRIMARY KEY,
    nome VARCHAR(150) NOT NULL,
    preco DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    estoque INTEGER NOT NULL DEFAULT 0,
    categoria_id INTEGER REFERENCES categorias(id) ON DELETE SET NULL,
    status VARCHAR(50) DEFAULT 'Ativo',
    sales INTEGER DEFAULT 0,
    criado_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS vendas (
    id SERIAL PRIMARY KEY,
    data TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    total_venda DECIMAL(10,2) NOT NULL DEFAULT 0.00
);

CREATE TABLE IF NOT EXISTS itens_venda (
    id SERIAL PRIMARY KEY,
    venda_id INTEGER REFERENCES vendas(id) ON DELETE CASCADE,
    produto_id INTEGER REFERENCES produtos(id) ON DELETE SET NULL,
    quantidade INTEGER NOT NULL CHECK (quantidade > 0),
    preco_unitario DECIMAL(10,2) NOT NULL
);

-- 2. Inserção de Dados Iniciais (Seed)
INSERT INTO categorias (nome, descricao) VALUES 
('Eletrônicos', 'Dispositivos eletrônicos e gadgets'),
('Periféricos', 'Teclados, mouses e monitores'),
('Acessórios', 'Fones de ouvido e cabos');

INSERT INTO produtos (nome, preco, estoque, categoria_id, status) VALUES 
('Smartphone Galaxy S24', 4500.00, 15, 1, 'Em Alta'),
('MacBook Air M2', 8200.00, 8, 1, 'Estável'),
('Fone Sony XM5', 2100.00, 22, 3, 'Em Alta'),
('Monitor Gamer 27"', 1800.00, 12, 2, 'Estável'),
('Teclado Mecânico RGB', 450.00, 30, 2, 'Em Alta');
