import pino from 'pino';
import pinoHttp from 'pino-http';
import { createApp } from './app.js';
import { config } from './config.js';
import { createMemoryStore } from './store/memory.js';

const logger = pino({ level: config.logLevel });

const app = createApp({
  store: createMemoryStore(),
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
// Stop accepting new connections, let in-flight requests finish, then exit.
function shutdown(signal) {
  logger.info({ signal }, 'shutting down');
  server.close(() => {
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
