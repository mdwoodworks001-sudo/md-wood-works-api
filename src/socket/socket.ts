import { Server as IOServer } from "socket.io";
import type { Server as HttpServer } from "node:http";
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
      origin: [
        "https://mdwoodworks.netlify.app",
        "http://localhost:4200",
        "http://localhost:5173",
      ],

      methods: ["GET", "POST"],

      credentials: true,
    },

    transports: ["polling", "websocket"],
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

      return next();
    } catch {
      return next();
    }
  });

  io.on("connection", (socket) => {
    console.log("Socket connected:", socket.id);

    console.log("Socket user:", socket.data.userId);

    console.log("Socket role:", socket.data.role);

    if (socket.data.role === "admin") {
      socket.join("admin");

      console.log(`Socket ${socket.id} joined admin room`);
    }

    if (socket.data.userId) {
      const userRoom = `user:${socket.data.userId}`;

      socket.join(userRoom);

      console.log(`Socket ${socket.id} joined ${userRoom}`);
    }

    socket.on("disconnect", (reason) => {
      console.log(`Socket disconnected: ${socket.id}`, reason);
    });
  });

  console.log("Socket.IO initialized");

  return io;
}

export function getIO(): IOServer {
  if (!io) {
    throw new Error("Socket.IO not initialized");
  }

  return io;
}

export const socketEvents = {
  newOrder(order: unknown) {
    getIO().to("admin").emit("order:new", order);

    console.log("Socket event emitted: order:new");
  },

  orderUpdated(order: any) {
    getIO().to("admin").emit("order:updated", order);

    const userId =
      typeof order.user === "object"
        ? (order.user?._id ?? order.user?.id)
        : order.user;

    if (userId) {
      getIO().to(`user:${userId}`).emit("order:status-changed", order);
    }

    console.log("Socket event emitted: order:updated");
  },

  categoryChanged(type: "created" | "updated" | "deleted", category: unknown) {
    getIO().emit("category:changed", {
      type,
      category,
    });

    console.log(`Socket event emitted: category ${type}`);
  },

  productChanged(type: "created" | "updated" | "deleted", product: unknown) {
    getIO().emit("product:changed", {
      type,
      product,
    });

    console.log(`Socket event emitted: product ${type}`);
  },
};
