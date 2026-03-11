import 'dotenv/config';

import pg from 'pg';

const { Pool } = pg;

const pool = new Pool({
  connectionString: process.env['DATABASE_URL'],
  ssl:
    process.env['NODE_ENV'] === 'production'
      ? { rejectUnauthorized: false }
      : undefined,
});

pool.on('error', (err) => {
  console.error('[DB] Unexpected pool error:', err.message);
});

export default pool;
