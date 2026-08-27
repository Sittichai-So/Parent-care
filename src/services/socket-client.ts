import { io, type Socket } from 'socket.io-client';

const SOCKET_URL = (process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:8024/api').replace(/\/api\/?$/, '');

let socket: Socket | null = null;

export function connectSocket(token: string): Socket {
  if (socket) {
    if (socket.connected) return socket;
    socket.disconnect();
  }
  socket = io(SOCKET_URL, {
    path: '/socket.io',
    auth: { token },
    transports: ['websocket'],
  });
  return socket;
}

export function getSocket(): Socket | null {
  return socket;
}

export function disconnectSocket() {
  socket?.disconnect();
  socket = null;
}