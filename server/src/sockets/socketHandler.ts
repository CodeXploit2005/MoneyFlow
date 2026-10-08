import { Server, Socket } from 'socket.io';
import { verifyAccessToken } from '../utils/jwt.js';
import GroupMember from '../models/GroupMember.js';
import User from '../models/User.js';

let ioInstance: Server | null = null;

export const initSocket = (server: any, clientUrl: string | string[]): Server => {
  ioInstance = new Server(server, {
    cors: {
      origin: clientUrl || 'http://localhost:5173',
      methods: ['GET', 'POST'],
      credentials: true
    }
  });

  // Middleware xác thực token cho socket connection
  ioInstance.use(async (socket: any, next: any) => {
    try {
      const token = socket.handshake.auth?.token || socket.handshake.headers?.authorization?.split(' ')[1];
      if (!token) {
        return next(new Error('Authentication error: Missing token'));
      }

      const decoded: any = verifyAccessToken(token);
      const user = decoded?.userId ? await User.findById(decoded.userId) : null;
      if (!user || (decoded.authVersion || 0) !== (user.authVersion || 0)) {
        return next(new Error('Authentication error: Invalid token'));
      }

      socket.userId = decoded.userId;
      next();
    } catch (err: any) {
      next(new Error('Authentication error: ' + (err?.message || err)));
    }
  });

  ioInstance.on('connection', (socket: any) => {
    console.log(`🔌 Socket connected: User ${socket.userId} (socket ID: ${socket.id})`);

    // Tham gia phòng của cá nhân để nhận thông báo riêng
    socket.join(`user_${socket.userId}`);

    // Tham gia phòng nhóm sau khi xác thực quyền thành viên
    socket.on('join_group', async (groupId: string) => {
      try {
        const isMember = await GroupMember.findOne({
          groupId,
          userId: socket.userId
        });

        if (isMember) {
          socket.join(`group_${groupId}`);
          console.log(`👥 User ${socket.userId} joined group_${groupId}`);
          socket.emit('joined_group_success', { groupId });
        } else {
          socket.emit('error_message', { message: 'Bạn không phải thành viên nhóm này' });
        }
      } catch (e) {
        console.error('Error joining group room:', e);
      }
    });

    socket.on('leave_group', (groupId: string) => {
      socket.leave(`group_${groupId}`);
      console.log(`👋 User ${socket.userId} left group_${groupId}`);
    });

    socket.on('disconnect', () => {
      console.log(`🔌 Socket disconnected: User ${socket.userId}`);
    });
  });

  return ioInstance;
};

export const getSocketIO = (): Server | null => {
  return ioInstance;
};
export default { initSocket, getSocketIO };
