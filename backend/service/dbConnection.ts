import 'dotenv/config';

import pg from 'pg';

const { Pool, types } = pg;

// Parse BIGINT (OID 20) as number instead of string
types.setTypeParser(20, (val) => Number(val));

const pool = new Pool({
  connectionString: process.env['DATABASE_URL'],
  ssl: { rejectUnauthorized: false },
});

pool.on('error', (err) => {
  console.error('[DB] Unexpected pool error:', err.message);
});

export default pool;
