/**
 * Thin wrapper around the parent-care-backend's Socket.IO server — same
 * minimal-dependency style as api-client.ts, kept separate because it's a
 * stateful connection (not a request/response call) with its own lifecycle.
 *
 * Attached to the same host as the REST API but not under `/api` — the
 * backend mounts it at `/socket.io` on the plain HTTP server, so this
 * strips the `/api` suffix off EXPO_PUBLIC_API_URL rather than reusing it.
 */
import { io, type Socket } from 'socket.io-client';

const SOCKET_URL = (process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:8024/api').replace(/\/api\/?$/, '');

let socket: Socket | null = null;

/** Opens (or reuses) the one socket connection for this session. The JWT is
 *  verified once during the handshake — an unauthenticated socket never
 *  connects — so `token` must be the same bearer token api-client.ts uses. */
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