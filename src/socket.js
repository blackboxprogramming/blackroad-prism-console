'use strict';

const { Server } = require('socket.io');
const metricsService = require('./services/metricsService');

function setupSockets(server) {
  const io = new Server(server, {
    path: '/socket.io',
    cors: {
      origin: '*', // NGINX will gate in front; you can tighten if needed.
      credentials: true
    }
  });

  io.on('connection', (socket) => {
    // Minimal welcome
    socket.emit('hello', { ok: true, t: Date.now() });

    // Clients can subscribe to periodic metrics
    let ticker = setInterval(async () => {
      try {
        const m = await metricsService.sample();
        socket.emit('metrics', m);
      } catch {}
    }, 2000);

    socket.on('disconnect', () => {
      clearInterval(ticker);
    });
  });

  return io;
}

module.exports = { setupSockets };
