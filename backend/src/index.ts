import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import pool from './db.js';

dotenv.config();

const app = express();
const port = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// --- ROTAS DA API ---

app.get('/', (req, res) => {
  res.send('API NTPBDados Rodando com PostgreSQL!');
});

// 1. Buscar Categorias
app.get('/api/categories', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM categorias ORDER BY nome');
    res.json(result.rows);
  } catch (err) {
    console.error('ERRO CRÍTICO /api/categories:', err);
    res.status(500).json({ error: 'Erro interno ao buscar categorias.', details: err instanceof Error ? err.message : String(err) });
  }
});

// 2. Buscar Produtos
app.get('/api/products', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT p.*, c.nome as categoria_nome 
      FROM produtos p 
      LEFT JOIN categorias c ON p.categoria_id = c.id 
      ORDER BY p.id DESC
    `);
    res.json(result.rows);
  } catch (err) {
    console.error('Erro /api/products:', err);
    res.status(500).json({ error: 'Erro ao buscar produtos.' });
  }
});

// 3. Buscar Estatísticas do Dashboard
app.get('/api/dashboard/stats', async (req, res) => {
  try {
    const statsQuery = await pool.query(`
      SELECT 
        (SELECT COALESCE(SUM(total_venda), 0) FROM vendas) as receita_total,
        (SELECT COUNT(*) FROM vendas) as total_vendas,
        (SELECT COUNT(*) FROM produtos) as total_produtos,
        (SELECT COALESCE(AVG(total_venda), 0) FROM vendas) as ticket_medio
    `);
    
    const rankingQuery = await pool.query(`
      SELECT p.nome, c.nome as cat, p.status, p.preco, p.estoque, p.sales
      FROM produtos p
      JOIN categorias c ON p.categoria_id = c.id
      ORDER BY p.sales DESC
      LIMIT 5
    `);

    res.json({
      metrics: statsQuery.rows[0],
      ranking: rankingQuery.rows
    });
  } catch (err) {
    console.error('Erro /api/dashboard/stats:', err);
    res.status(500).json({ error: 'Erro ao processar estatísticas.' });
  }
});

// 4. Registrar Venda (CORRIGIDO: Coluna 'quantidade' em vez de 'quantity')
app.post('/api/sales', async (req, res) => {
  const { productId, quantity } = req.body;
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    
    const productRes = await client.query('SELECT preco, estoque FROM produtos WHERE id = $1', [productId]);
    if (productRes.rows.length === 0) throw new Error('Produto não encontrado.');
    
    const { preco, estoque } = productRes.rows[0];
    if (estoque < quantity) throw new Error('Estoque insuficiente no banco.');
    
    const totalVenda = preco * quantity;

    // Inserir Venda
    const vendaRes = await client.query(
      'INSERT INTO vendas (total_venda) VALUES ($1) RETURNING id', 
      [totalVenda]
    );
    const vendaId = vendaRes.rows[0].id;

    // Inserir Item (Ajustado para coluna 'quantidade')
    await client.query(
      'INSERT INTO itens_venda (venda_id, produto_id, quantidade, preco_unitario) VALUES ($1, $2, $3, $4)', 
      [vendaId, productId, quantity, preco]
    );

    // Atualizar Produto
    await client.query(
      'UPDATE produtos SET estoque = estoque - $1, sales = sales + $1 WHERE id = $2', 
      [quantity, productId]
    );

    await client.query('COMMIT');
    res.json({ success: true, message: 'Venda processada com sucesso no PostgreSQL!' });
  } catch (err: any) {
    await client.query('ROLLBACK');
    console.error('Erro /api/sales:', err);
    res.status(400).json({ error: err.message });
  } finally {
    client.release();
  }
});

// 5. Cadastrar Produto
app.post('/api/products', async (req, res) => {
  const { nome, preco, estoque, categoria_id } = req.body;
  try {
    const result = await pool.query(
      'INSERT INTO produtos (nome, preco, estoque, categoria_id, status) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [nome, preco, estoque, categoria_id, 'Ativo']
    );
    res.json({ success: true, product: result.rows[0], message: 'Produto cadastrado com sucesso!' });
  } catch (err) {
    console.error('Erro /api/products:', err);
    res.status(500).json({ error: 'Erro ao cadastrar produto no banco.' });
  }
});

app.listen(port, () => {
  console.log(`🚀 Servidor auditado rodando na porta ${port}`);
});
