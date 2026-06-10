import express from 'express';
import dotenv from 'dotenv';
// Dotenv deve vir antes de qualquer importação que use o banco
dotenv.config();

import cors from 'cors';
import crypto from 'crypto';
import { promisify } from 'util';
import type { NextFunction, Request, Response } from 'express';
import pool from './db.js';

const app = express();
const port = process.env.PORT || 3001;
const scryptAsync = promisify(crypto.scrypt);
const authSecret = process.env.AUTH_SECRET || 'ntpb-dados-dev-secret-change-me';

type AuthUser = {
  id: number;
  nome: string;
  email: string;
  perfil: string;
};

type AuthRequest = Request & {
  user?: AuthUser;
};

app.use(cors());
app.use(express.json());

async function hashPassword(password: string) {
  const salt = crypto.randomBytes(16).toString('hex');
  const derivedKey = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${salt}:${derivedKey.toString('hex')}`;
}

async function verifyPassword(password: string, storedHash: string) {
  const [salt, key] = storedHash.split(':');
  if (!salt || !key) return false;

  const derivedKey = (await scryptAsync(password, salt, 64)) as Buffer;
  const storedKey = Buffer.from(key, 'hex');
  return storedKey.length === derivedKey.length && crypto.timingSafeEqual(storedKey, derivedKey);
}

function base64Url(value: string | Buffer) {
  return Buffer.from(value).toString('base64url');
}

function signToken(user: AuthUser) {
  const header = base64Url(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const payload = base64Url(JSON.stringify({
    sub: user.id,
    nome: user.nome,
    email: user.email,
    perfil: user.perfil,
    exp: Math.floor(Date.now() / 1000) + 60 * 60 * 8
  }));
  const signature = crypto.createHmac('sha256', authSecret).update(`${header}.${payload}`).digest('base64url');
  return `${header}.${payload}.${signature}`;
}

function verifyToken(token: string): AuthUser | null {
  const [header, payload, signature] = token.split('.');
  if (!header || !payload || !signature) return null;

  const expectedSignature = crypto.createHmac('sha256', authSecret).update(`${header}.${payload}`).digest('base64url');
  const signatureBuffer = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expectedSignature);

  if (signatureBuffer.length !== expectedBuffer.length || !crypto.timingSafeEqual(signatureBuffer, expectedBuffer)) {
    return null;
  }

  const decoded = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8')) as {
    sub: number;
    nome: string;
    email: string;
    perfil: string;
    exp: number;
  };

  if (!decoded.exp || decoded.exp < Math.floor(Date.now() / 1000)) return null;

  return {
    id: decoded.sub,
    nome: decoded.nome,
    email: decoded.email,
    perfil: decoded.perfil
  };
}

function requireAuth(req: AuthRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;

  if (!token) {
    return res.status(401).json({ error: 'Token de autenticação não informado.' });
  }

  try {
    const user = verifyToken(token);
    if (!user) return res.status(401).json({ error: 'Sessão inválida ou expirada.' });
    req.user = user;
    return next();
  } catch (err) {
    console.error('ERRO requireAuth:', err);
    return res.status(401).json({ error: 'Sessão inválida ou expirada.' });
  }
}

// --- ROTAS DA API ---

app.get('/', (req, res) => {
  res.send('API NTPBDados Rodando com PostgreSQL!');
});

app.post('/api/auth/register', async (req, res) => {
  const { nome, email, password } = req.body;

  if (!nome || !email || !password) {
    return res.status(400).json({ error: 'Nome, e-mail e senha são obrigatórios.' });
  }

  if (String(password).length < 6) {
    return res.status(400).json({ error: 'A senha deve ter pelo menos 6 caracteres.' });
  }

  try {
    const passwordHash = await hashPassword(String(password));
    const result = await pool.query(
      `INSERT INTO usuarios (nome, email, senha_hash)
       VALUES ($1, LOWER($2), $3)
       RETURNING id, nome, email, perfil`,
      [nome, email, passwordHash]
    );

    const user = result.rows[0] as AuthUser;
    res.status(201).json({ user, token: signToken(user) });
  } catch (err: any) {
    if (err?.code === '23505') {
      return res.status(409).json({ error: 'Este e-mail já está cadastrado.' });
    }

    console.error('ERRO /api/auth/register:', err);
    return res.status(500).json({ error: 'Erro ao cadastrar usuário.' });
  }
});

app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'E-mail e senha são obrigatórios.' });
  }

  try {
    const result = await pool.query(
      'SELECT id, nome, email, perfil, senha_hash FROM usuarios WHERE email = LOWER($1)',
      [email]
    );

    const userRecord = result.rows[0];
    if (!userRecord || !(await verifyPassword(String(password), userRecord.senha_hash))) {
      return res.status(401).json({ error: 'Credenciais inválidas.' });
    }

    const user: AuthUser = {
      id: userRecord.id,
      nome: userRecord.nome,
      email: userRecord.email,
      perfil: userRecord.perfil
    };

    return res.json({ user, token: signToken(user) });
  } catch (err) {
    console.error('ERRO /api/auth/login:', err);
    return res.status(500).json({ error: 'Erro ao autenticar usuário.' });
  }
});

app.get('/api/auth/me', requireAuth, (req: AuthRequest, res) => {
  res.json({ user: req.user });
});

// 1. Buscar Categorias
app.get('/api/categories', requireAuth, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM categorias ORDER BY nome');
    res.json(result.rows);
  } catch (err) {
    console.error('ERRO /api/categories:', err);
    res.status(500).json({ error: 'Erro interno ao buscar categorias.' });
  }
});

// 2. Buscar Produtos
app.get('/api/products', requireAuth, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT p.*, c.nome as categoria_nome 
      FROM produtos p 
      LEFT JOIN categorias c ON p.categoria_id = c.id 
      ORDER BY p.id DESC
    `);
    res.json(result.rows);
  } catch (err) {
    console.error('ERRO /api/products:', err);
    res.status(500).json({ error: 'Erro ao buscar produtos.' });
  }
});

// 3. Buscar Estatísticas do Dashboard
app.get('/api/dashboard/stats', requireAuth, async (req, res) => {
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
    console.error('ERRO /api/dashboard/stats:', err);
    res.status(500).json({ error: 'Erro ao processar estatísticas.' });
  }
});

// 4. Registrar Venda
app.post('/api/sales', requireAuth, async (req, res) => {
  const { productId, quantity } = req.body;
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const productRes = await client.query('SELECT preco, estoque FROM produtos WHERE id = $1', [productId]);
    if (productRes.rows.length === 0) throw new Error('Produto não encontrado.');
    const { preco, estoque } = productRes.rows[0];
    if (estoque < quantity) throw new Error('Estoque insuficiente no banco.');
    const totalVenda = preco * quantity;
    const vendaRes = await client.query('INSERT INTO vendas (total_venda) VALUES ($1) RETURNING id', [totalVenda]);
    const vendaId = vendaRes.rows[0].id;
    await client.query('INSERT INTO itens_venda (venda_id, produto_id, quantidade, preco_unitario) VALUES ($1, $2, $3, $4)', [vendaId, productId, quantity, preco]);
    await client.query('UPDATE produtos SET estoque = estoque - $1, sales = sales + $1 WHERE id = $2', [quantity, productId]);
    await client.query('COMMIT');
    res.json({ success: true, message: 'Venda processada com sucesso no PostgreSQL!' });
  } catch (err: any) {
    await client.query('ROLLBACK');
    res.status(400).json({ error: err.message });
  } finally {
    client.release();
  }
});

// 5. Cadastrar Produto
app.post('/api/products', requireAuth, async (req, res) => {
  const { nome, preco, estoque, categoria_id } = req.body;
  try {
    const result = await pool.query(
      'INSERT INTO produtos (nome, preco, estoque, categoria_id, status) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [nome, preco, estoque, categoria_id, 'Ativo']
    );
    res.json({ success: true, product: result.rows[0], message: 'Produto cadastrado com sucesso!' });
  } catch (err) {
    console.error('ERRO /api/products:', err);
    res.status(500).json({ error: 'Erro ao cadastrar produto.' });
  }
});

const server = app.listen(port, () => {
  console.log(`Servidor auditado rodando na porta ${port}`);
});

server.ref();

server.on('error', (err) => {
  console.error('Erro ao iniciar servidor HTTP:', err);
});
