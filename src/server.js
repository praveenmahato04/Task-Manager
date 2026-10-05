const app = require('./app');

const PORT = process.env.PORT || 3000;
const HOST = '0.0.0.0'; // must bind to 0.0.0.0, not localhost, for cloud hosting

const server = app.listen(PORT, HOST, () => {
  console.log(`Server running on http://${HOST}:${PORT}`);
});

// Graceful shutdown (important for zero-downtime deploys on most PaaS platforms)
process.on('SIGTERM', () => {
  console.log('SIGTERM received: closing server');
  server.close(() => process.exit(0));
});
process.on('SIGINT', () => {
  console.log('SIGINT received: closing server');
  server.close(() => process.exit(0));
});
