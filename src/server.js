import pino from 'pino';
import pinoHttp from 'pino-http';
import { createApp } from './app.js';
import { config } from './config.js';
import { createMemoryStore } from './store/memory.js';
import { createPostgresStore } from './store/postgres.js';

const logger = pino({ level: config.logLevel });

// PostgreSQL when DATABASE_URL is set; in-memory otherwise (quick local runs, tests)
const store = config.databaseUrl
  ? await createPostgresStore(config.databaseUrl, logger)
  : createMemoryStore();
logger.info({ store: config.databaseUrl ? 'postgres' : 'memory' }, 'storage ready');

const app = createApp({
  store,
  baseUrl: config.baseUrl,
  logger: pinoHttp({ logger }),
});

const server = app.listen(config.port, (err) => {
  if (err) {
    logger.fatal(err, 'failed to start');
    process.exit(1);
  }
  logger.info({ port: config.port }, 'snip listening');
});

// Graceful shutdown: Kubernetes sends SIGTERM before killing a pod.
// Stop accepting new connections, let in-flight requests finish, close the DB, then exit.
function shutdown(signal) {
  logger.info({ signal }, 'shutting down');
  server.close(async () => {
    await store.close?.();
    logger.info('all connections closed');
    process.exit(0);
  });
  // If something hangs, don't wait forever
  setTimeout(() => {
    logger.error('forced shutdown after 10s');
    process.exit(1);
  }, 10_000).unref();
}

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown); // Ctrl+C
