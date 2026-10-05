import app from './app.js';
import { env, getMissingRequiredEnv } from './config/env.js';
import { connectDB } from './config/db.js';

const missing = getMissingRequiredEnv();
if (missing.length) {
  console.error(`Missing required environment variable(s): ${missing.join(', ')}. See .env.example.`);
  process.exit(1);
}

if (!env.contact.whatsapp) {
  console.warn('JMC_WHATSAPP_NUMBER is not set: GET /api/settings/contact will return a configuration error.');
}
if (!env.FRONTEND_ORIGINS.length) {
  console.warn('FRONTEND_URL is not set: browser requests from other origins will be blocked by CORS.');
}

const PORT = process.env.PORT || 5000;

try {
  await connectDB();
} catch (err) {
  console.error('MongoDB connection failed:', err.message);
  process.exit(1);
}

const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`JMC API listening on 0.0.0.0:${PORT} (${env.NODE_ENV})`);
});

const shutdown = (signal) => {
  console.log(`${signal} received, shutting down`);
  server.close(() => process.exit(0));
};
process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
