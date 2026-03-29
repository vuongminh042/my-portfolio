import { io } from 'socket.io-client';

const socketUrl =
  import.meta.env.VITE_SOCKET_URL ||
  (typeof window !== 'undefined' ? window.location.origin : 'http://localhost:5000');

export const socket = io(socketUrl, {
  transports: ['websocket'],
  autoConnect: true,
});

export default socket;

