require('dotenv').config();
const http = require('http');
const app = require('./app');
const connectDB = require('./config/db');
const initSocket = require('./sockets/socket');

const PORT = process.env.PORT || 5000;

const start = async () => {
  await connectDB();

  const server = http.createServer(app);
  initSocket(server);

  server.listen(PORT, () => {
    console.log(`[server] EventPulse API listening on port ${PORT}`);
  });
};

start();

process.on('unhandledRejection', (err) => {
  console.error('[unhandledRejection]', err);
  process.exit(1);
});
