import { Redis } from 'ioredis';

const redisConnection = new Redis({
  host: process.env['REDIS_HOST'],
  port: Number(process.env['REDIS_PORT']),
  username: process.env['REDIS_USER'],
  password: process.env['REDIS_PW'],
  maxRetriesPerRequest: null, // Required by BullMQ
});

redisConnection.on('error', (err) => {
  console.error('[Redis] Connection error:', err.message);
});

redisConnection.on('connect', () => {
  console.log('[Redis] Connected successfully');
});

export default redisConnection;
