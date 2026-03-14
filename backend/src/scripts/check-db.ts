import { Client } from 'pg';

async function checkDatabaseConnection(): Promise<void> {
  const nodeEnv = process.env.NODE_ENV || 'development';
  const port = Number(process.env.DB_PORT ?? 5432);
  const user =
    nodeEnv === 'test'
      ? process.env.TEST_DB_USER || process.env.DB_USER || 'postgres'
      : nodeEnv === 'development'
        ? process.env.DEV_DB_USER || process.env.DB_USER || 'postgres'
        : process.env.DB_USER || 'postgres';
  const password =
    nodeEnv === 'test'
      ? process.env.TEST_DB_PASSWORD || process.env.DB_PASSWORD
      : nodeEnv === 'development'
        ? process.env.DEV_DB_PASSWORD || process.env.DB_PASSWORD
        : process.env.DB_PASSWORD;

  if (Number.isNaN(port)) {
    throw new Error('DB_PORT is invalid in backend/.env. It must be a number.');
  }

  if (!password || password === 'password') {
    throw new Error(
      `Database password is missing or placeholder for NODE_ENV=${nodeEnv}. Set DEV_DB_PASSWORD/TEST_DB_PASSWORD (or DB_PASSWORD) in backend/.env.`,
    );
  }

  const client = new Client({
    host: process.env.DB_HOST || 'localhost',
    port,
    user,
    password,
    database: process.env.DB_NAME || 'pulse_erp_db',
  });

  try {
    await client.connect();
    const result = await client.query('SELECT current_database() AS db, current_user AS user');
    const row = result.rows[0];
    console.log(`Database connection OK. db=${row.db} user=${row.user}`);
  } finally {
    await client.end().catch(() => undefined);
  }
}

checkDatabaseConnection().catch((error) => {
  console.error('Database connection check failed:', error.message);
  process.exit(1);
});
