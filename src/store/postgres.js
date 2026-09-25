import pg from 'pg';

// PostgreSQL storage with the same async interface as the memory store.
export async function createPostgresStore(connectionString, logger) {
  const pool = new pg.Pool({ connectionString });

  // An idle connection can drop (e.g. the database restarts). Log it instead of
  // crashing; the pool opens a fresh connection on the next query.
  pool.on('error', (err) => logger.warn({ err }, 'postgres idle client error'));

  // Simple schema setup on startup. Bigger projects use a migration tool.
  await pool.query(`
    CREATE TABLE IF NOT EXISTS links (
      code       text PRIMARY KEY,
      url        text NOT NULL,
      clicks     integer NOT NULL DEFAULT 0,
      created_at timestamptz NOT NULL DEFAULT now()
    )
  `);

  const toLink = (row) =>
    row && { code: row.code, url: row.url, clicks: row.clicks, createdAt: row.created_at.toISOString() };

  // $1, $2 are query parameters: values are never pasted into the SQL text,
  // which is what prevents SQL injection.
  return {
    async create(code, url) {
      const { rows } = await pool.query('INSERT INTO links (code, url) VALUES ($1, $2) RETURNING *', [code, url]);
      return toLink(rows[0]);
    },
    async get(code) {
      const { rows } = await pool.query('SELECT * FROM links WHERE code = $1', [code]);
      return toLink(rows[0]) ?? null;
    },
    async incrementClicks(code) {
      await pool.query('UPDATE links SET clicks = clicks + 1 WHERE code = $1', [code]);
    },
    async ping() {
      await pool.query('SELECT 1');
    },
    async close() {
      await pool.end();
    },
  };
}
