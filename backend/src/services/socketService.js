const socketIo = require('socket.io');

let io;

exports.init = (server) => {
  io = socketIo(server, {
    cors: { origin: process.env.FRONTEND_URL || '*', methods: ['GET', 'POST'] }
  });

  io.on('connection', (socket) => {
    console.log(`Socket connected: ${socket.id}`);
    
    socket.on('subscribe', (symbol) => {
      socket.join(symbol);
    });
    
    socket.on('unsubscribe', (symbol) => {
      socket.leave(symbol);
    });

    socket.on('disconnect', () => {
      console.log(`Socket disconnected: ${socket.id}`);
    });
  });
};

exports.emitPriceUpdate = (symbol, priceData) => {
  if (io) io.to(symbol).emit('priceUpdate', { symbol, ...priceData });
};

exports.emitOrderExecuted = (userId, order) => {
  if (io) io.emit(`orderExecuted_${userId}`, order);
};

exports.emitAlertTriggered = (userId, alert) => {
  if (io) io.emit(`alertTriggered_${userId}`, alert);
};
