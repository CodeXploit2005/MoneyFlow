import { useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuthStore } from '../store/authStore';
import { SOCKET_URL } from '../api/config';

// Mounted once in AppLayout. Switching pages or group rooms keeps the connection.
export const useSocket = (groupId: string | null = null): Socket | null => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const token = useAuthStore(state => state.token);
  useEffect(() => {
    if (!token) { setSocket(null); return; }
    const connection = io(SOCKET_URL, { auth: { token }, transports: ['websocket', 'polling'], tryAllTransports: true, reconnectionDelay: 2000, reconnectionDelayMax: 15000 });
    setSocket(connection);
    return () => { connection.disconnect(); };
  }, [token]);
  useEffect(() => {
    if (!socket || !groupId) return;
    const join = () => socket.emit('join_group', groupId);
    socket.on('connect', join);
    if (socket.connected) join();
    return () => { socket.off('connect', join); socket.emit('leave_group', groupId); };
  }, [socket, groupId]);
  return socket;
};
