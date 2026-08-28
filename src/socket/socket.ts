import { Server as IOServer } from "socket.io";
import type { Server as HttpServer } from "http";
import jwt from "jsonwebtoken";
import { env } from "../config/env.js";

export interface SocketAuthUser {
  id: string;
  role: "user" | "admin";
}

let io: IOServer | null = null;

export function initSocket(httpServer: HttpServer) {
  io = new IOServer(httpServer, {
    cors: {
  origin: "*",
},
  });

  io.use((socket, next) => {
    const token = socket.handshake.auth?.token as string | undefined;

    if (!token) {
      return next();
    }

    try {
      const payload = jwt.verify(token, env.jwt.accessSecret) as SocketAuthUser;
      socket.data.userId = payload.id;
      socket.data.role = payload.role;
      next();
    } catch {
      next();
    }
  });

  io.on("connection", (socket) => {
    if (socket.data.role === "admin") socket.join("admin");
    if (socket.data.userId) socket.join(`user:${socket.data.userId}`);
  });

  return io;
}

export function getIO(): IOServer {
  if (!io) throw new Error("Socket.io not initialized");
  return io;
}

export const socketEvents = {
  newOrder(order: unknown) {
    getIO().to("admin").emit("order:new", order);
  },
  orderUpdated(order: any) {
    getIO().to("admin").emit("order:updated", order);
    const userId =
      typeof order.user === "object"
        ? (order.user._id ?? order.user.id)
        : order.user;
    if (userId)
      getIO().to(`user:${userId}`).emit("order:status-changed", order);
  },
  categoryChanged(type: "created" | "updated" | "deleted", category: unknown) {
    getIO().emit("category:changed", { type, category });
  },
  productChanged(type: "created" | "updated" | "deleted", product: unknown) {
    getIO().emit("product:changed", { type, product });
  },
};
