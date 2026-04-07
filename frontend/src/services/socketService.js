import { io } from 'socket.io-client';

class SocketService {
  constructor() {
    this.socket = null;
  }

  connect() {
    if (!this.socket) {
      const url = import.meta.env.VITE_API_URL?.replace('/api','') || 'http://localhost:5000';
      this.socket = io(url);
    }
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  subscribeToPrice(symbol, callback) {
    if (this.socket) {
      this.socket.emit('subscribe', symbol);
      this.socket.on('priceUpdate', (data) => {
        if(data.symbol === symbol) callback(data);
      });
    }
  }

  unsubscribeFromPrice(symbol) {
    if (this.socket) this.socket.emit('unsubscribe', symbol);
  }
}

export default new SocketService();
