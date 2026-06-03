import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pg;

console.log('📡 Tentando conectar ao banco via:', process.env.DATABASE_URL);

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

pool.on('connect', () => {
  console.log('📦 Conexão com PostgreSQL estabelecida com sucesso!');
});

pool.on('error', (err) => {
  console.error('❌ Erro inesperado no cliente PostgreSQL', err);
});

export default pool;
