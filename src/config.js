// All configuration comes from environment variables (12-factor app),
// with defaults that work on a laptop.
const port = Number(process.env.PORT ?? 3000);

export const config = {
  port,
  baseUrl: process.env.BASE_URL ?? `http://localhost:${port}`,
  logLevel: process.env.LOG_LEVEL ?? 'info',
};
