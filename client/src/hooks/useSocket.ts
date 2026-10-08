import { useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuthStore } from '../store/authStore';

export const useSocket = (groupId: string | null = null): Socket | null => {
  const socketRef = useRef<Socket | null>(null);
  const token = useAuthStore((state) => state.token);

  useEffect(() => {
    if (!token) return;

    const socketUrl = import.meta.env.VITE_SOCKET_URL || window.location.origin;
    const socket = io(socketUrl, {
      auth: { token },
      transports: ['websocket', 'polling']
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      if (groupId) {
        socket.emit('join_group', groupId);
      }
    });

    if (groupId) {
      socket.emit('join_group', groupId);
    }

    return () => {
      if (groupId) {
        socket.emit('leave_group', groupId);
      }
      socket.disconnect();
    };
  }, [token, groupId]);

  return socketRef.current;
};
