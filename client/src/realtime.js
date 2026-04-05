import { io } from 'socket.io-client';

function normalizeBaseUrl(value) {
  return String(value || '')
    .trim()
    .replace(/\/$/, '')
    .replace(/\/api$/i, '');
}

const envSocketUrl = normalizeBaseUrl(import.meta.env.VITE_SOCKET_URL);
const envApiUrl = normalizeBaseUrl(import.meta.env.VITE_API_URL);
const devTarget = normalizeBaseUrl(import.meta.env.VITE_DEV_PROXY_TARGET);
const isLocalDev =
  import.meta.env.DEV &&
  typeof window !== 'undefined' &&
  ['localhost', '127.0.0.1'].includes(window.location.hostname);

const socketUrl = isLocalDev
  ? devTarget || 'http://localhost:5000'
  : envSocketUrl || envApiUrl || (typeof window !== 'undefined' ? window.location.origin : 'http://localhost:5000');

let currentSocketToken =
  typeof window !== 'undefined' ? window.localStorage.getItem('token') || '' : '';

export const socket = io(socketUrl, {
  transports: ['websocket', 'polling'],
  autoConnect: true,
  withCredentials: true,
  auth: currentSocketToken ? { token: currentSocketToken } : {},
});

export function setSocketAuth(token) {
  const nextToken = token || '';
  if (nextToken === currentSocketToken && socket.connected) {
    return;
  }

  currentSocketToken = nextToken;
  socket.auth = nextToken ? { token: nextToken } : {};

  socket.disconnect();
  socket.connect();
}

export default socket;

