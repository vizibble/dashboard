import type { Server as HttpServer } from 'http';
import { Server as SocketIOServer, Socket } from 'socket.io';

import { hasDevicePermission } from '@/models/auth.js';
import { expectError } from '@/utils/expectError.js';
import { type AuthJwtPayload, verifyAccessToken } from '@/utils/jwtToken.js';
import { getTimestamp } from '@/utils/time.js';

// Extend Socket to carry the authenticated user
interface AuthSocket extends Socket {
  user: AuthJwtPayload;
}

let io: SocketIOServer | null = null;
export function initSocket(httpServer: HttpServer): SocketIOServer {
  const corsOrigin = process.env["CORS_ORIGIN"];

  io = new SocketIOServer(httpServer, {
    cors: {
      origin: corsOrigin,
      credentials: true,
    },
  });

  io.use((socket, next) => {
    try {
      let token = socket.handshake.auth?.token;

      if (!token) return next(new Error("AUTH_ERROR"));

      const user = verifyAccessToken(token);
      if (!user || !user.user_id) return next(new Error("AUTH_ERROR"));

      (socket as AuthSocket).user = user;
      next();
    } catch {
      next(new Error("AUTH_ERROR"));
    }
  });

  io.on("connection", (rawSocket) => {
    const socket = rawSocket as AuthSocket;
    // Client subscribes to a device room
    socket.on("subscribe", async (deviceId: string) => {
      const [err, allowed] = await expectError(
        hasDevicePermission(socket.user.user_id, deviceId),
      );
      if (err) {
        console.error(`[${getTimestamp()}] Subscription error:`, err);
        return;
      }
      if (allowed) {
        socket.join(`device-${deviceId}`);
        console.log(
          `[${getTimestamp()}] User ${socket.user.user_id} subscribed to device-${deviceId}`,
        );
        return;
      } else {
        console.warn(
          `[${getTimestamp()}] Unauthorized subscription attempt by user ${socket.user.user_id} for device ${deviceId}`,
        );
      }
    });

    // Client unsubscribes from a device room (on device switch)
    socket.on("unsubscribe", (deviceId: string) => {
      socket.leave(`device-${deviceId}`);
      console.log(
        `[${getTimestamp()}] User ${socket.user.user_id} unsubscribed from device-${deviceId}`,
      );
    });

    socket.on("disconnect", () => {
      console.log(
        `[${getTimestamp()}] User ${socket.user.user_id} disconnected`,
      );
    });
  });
  return io;
}

/**
 * Emit an event to a specific device room.
 * Only clients that have subscribed will receive it.
 */
export function emitToFrontend(
  room: string,
  event: string,
  data: unknown,
): void {
  if (!io) {
    console.warn(
      `[${getTimestamp()}] Socket.io not initialized. Cannot emit '${event}'.`,
    );
    return;
  }
  io.to(room).emit(event, data);
}
