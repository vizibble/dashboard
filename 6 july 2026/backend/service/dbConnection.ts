// import 'dotenv/config';

// import pg from 'pg';

// const { Pool, types } = pg;

// // Parse BIGINT (OID 20) as number instead of string
// types.setTypeParser(20, (val) => Number(val));

// const pool = new Pool({
//   connectionString: process.env['DATABASE_URL'],
//   ssl: { rejectUnauthorized: false },
//   max: 10,
//   // Time to wait for a connection to become available before erroring.
//   connectionTimeoutMillis: 5000,
//   // Automatically cancel any query that takes longer than 30s.
//   statement_timeout: 30000,
// });
// pool.on('error', (err) => {
//   console.error('[DB] Pool error:', err.message);
// });

// export default pool;



import { Pool } from "pg";

const pool = new Pool({
  host: "localhost",
  port: 5432,
  user: "postgres",
  password: "root",
  database: "analytics_email_builder"
});

export default pool;
