// import { Server as IOServer } from "socket.io";
// import type { Server as HttpServer } from "http";
// import jwt from "jsonwebtoken";
// import { env } from "../config/env.js";

// export interface SocketAuthUser {
//   id: string;
//   role: "user" | "admin";
// }

// let io: IOServer | null = null;

// export function initSocket(httpServer: HttpServer) {
//   io = new IOServer(httpServer, {
//     cors: {
//   origin: "*",
// },
//   });

//   io.use((socket, next) => {
//     const token = socket.handshake.auth?.token as string | undefined;

//     if (!token) {
//       return next();
//     }

//     try {
//       const payload = jwt.verify(token, env.jwt.accessSecret) as SocketAuthUser;
//       socket.data.userId = payload.id;
//       socket.data.role = payload.role;
//       next();
//     } catch {
//       next();
//     }
//   });

//   io.on("connection", (socket) => {
//     if (socket.data.role === "admin") socket.join("admin");
//     if (socket.data.userId) socket.join(`user:${socket.data.userId}`);
//   });

//   return io;
// }

// export function getIO(): IOServer {
//   if (!io) throw new Error("Socket.io not initialized");
//   return io;
// }

// export const socketEvents = {
//   newOrder(order: unknown) {
//     getIO().to("admin").emit("order:new", order);
//   },
//   orderUpdated(order: any) {
//     getIO().to("admin").emit("order:updated", order);
//     const userId =
//       typeof order.user === "object"
//         ? (order.user._id ?? order.user.id)
//         : order.user;
//     if (userId)
//       getIO().to(`user:${userId}`).emit("order:status-changed", order);
//   },
//   categoryChanged(type: "created" | "updated" | "deleted", category: unknown) {
//     getIO().emit("category:changed", { type, category });
//   },
//   productChanged(type: "created" | "updated" | "deleted", product: unknown) {
//     getIO().emit("product:changed", { type, product });
//   },
// };
import { Server as IOServer } from "socket.io";
import type { Server as HttpServer } from "node:http";
import jwt from "jsonwebtoken";

import { env } from "../config/env.js";

export interface SocketAuthUser {
  id: string;
  role: "user" | "admin";
}

let io: IOServer | null = null;

export function initSocket(
  httpServer: HttpServer,
) {
  io = new IOServer(httpServer, {
    cors: {
      origin: [
        "https://mdwoodworks.netlify.app",
        "http://localhost:4200",
        "http://localhost:5173",
      ],

      methods: [
        "GET",
        "POST",
      ],

      credentials: true,
    },

    transports: [
      "polling",
      "websocket",
    ],
  });

  /*
  |--------------------------------------------------------------------------
  | Socket Authentication
  |--------------------------------------------------------------------------
  */

  io.use((socket, next) => {
    const token = socket.handshake.auth
      ?.token as string | undefined;

    /*
    |--------------------------------------------------------------------------
    | Allow guest connections
    |--------------------------------------------------------------------------
    */

    if (!token) {
      return next();
    }

    try {
      const payload = jwt.verify(
        token,
        env.jwt.accessSecret,
      ) as SocketAuthUser;

      socket.data.userId = payload.id;
      socket.data.role = payload.role;

      return next();
    } catch {
      /*
      |--------------------------------------------------------------------------
      | Invalid token
      | Currently allowing guest connection.
      |--------------------------------------------------------------------------
      */

      return next();
    }
  });

  /*
  |--------------------------------------------------------------------------
  | Socket Connection
  |--------------------------------------------------------------------------
  */

  io.on("connection", (socket) => {
    console.log(
      "Socket connected:",
      socket.id,
    );

    console.log(
      "Socket user:",
      socket.data.userId,
    );

    console.log(
      "Socket role:",
      socket.data.role,
    );

    /*
    |--------------------------------------------------------------------------
    | Admin Room
    |--------------------------------------------------------------------------
    */

    if (socket.data.role === "admin") {
      socket.join("admin");

      console.log(
        `Socket ${socket.id} joined admin room`,
      );
    }

    /*
    |--------------------------------------------------------------------------
    | User Room
    |--------------------------------------------------------------------------
    */

    if (socket.data.userId) {
      const userRoom =
        `user:${socket.data.userId}`;

      socket.join(userRoom);

      console.log(
        `Socket ${socket.id} joined ${userRoom}`,
      );
    }

    /*
    |--------------------------------------------------------------------------
    | Disconnect
    |--------------------------------------------------------------------------
    */

    socket.on("disconnect", (reason) => {
      console.log(
        `Socket disconnected: ${socket.id}`,
        reason,
      );
    });
  });

  console.log("Socket.IO initialized");

  return io;
}

/*
|--------------------------------------------------------------------------
| Get Socket.IO Instance
|--------------------------------------------------------------------------
*/

export function getIO(): IOServer {
  if (!io) {
    throw new Error(
      "Socket.IO not initialized",
    );
  }

  return io;
}

/*
|--------------------------------------------------------------------------
| Socket Events
|--------------------------------------------------------------------------
*/

export const socketEvents = {
  /*
  |--------------------------------------------------------------------------
  | New Order
  |--------------------------------------------------------------------------
  */

  newOrder(order: unknown) {
    getIO()
      .to("admin")
      .emit("order:new", order);

    console.log(
      "Socket event emitted: order:new",
    );
  },

  /*
  |--------------------------------------------------------------------------
  | Order Updated
  |--------------------------------------------------------------------------
  */

  orderUpdated(order: any) {
    /*
    |--------------------------------------------------------------------------
    | Notify Admins
    |--------------------------------------------------------------------------
    */

    getIO()
      .to("admin")
      .emit(
        "order:updated",
        order,
      );

    /*
    |--------------------------------------------------------------------------
    | Find Order User
    |--------------------------------------------------------------------------
    */

    const userId =
      typeof order.user === "object"
        ? (
            order.user?._id ??
            order.user?.id
          )
        : order.user;

    /*
    |--------------------------------------------------------------------------
    | Notify Specific User
    |--------------------------------------------------------------------------
    */

    if (userId) {
      getIO()
        .to(`user:${userId}`)
        .emit(
          "order:status-changed",
          order,
        );
    }

    console.log(
      "Socket event emitted: order:updated",
    );
  },

  /*
  |--------------------------------------------------------------------------
  | Category Changed
  |--------------------------------------------------------------------------
  */

  categoryChanged(
    type: "created" | "updated" | "deleted",
    category: unknown,
  ) {
    getIO().emit(
      "category:changed",
      {
        type,
        category,
      },
    );

    console.log(
      `Socket event emitted: category ${type}`,
    );
  },

  /*
  |--------------------------------------------------------------------------
  | Product Changed
  |--------------------------------------------------------------------------
  */

  productChanged(
    type: "created" | "updated" | "deleted",
    product: unknown,
  ) {
    getIO().emit(
      "product:changed",
      {
        type,
        product,
      },
    );

    console.log(
      `Socket event emitted: product ${type}`,
    );
  },
};
