import http from "node:http";

import app from "./app.js";
import { env } from "./config/env.js";
import {
  connectDatabase,
  disconnectDatabase,
} from "./config/database.js";

import {
  initSocket,
  getIO,
} from "./socket/socket.js";

async function bootstrap() {
  try {

    await connectDatabase();

    const httpServer = http.createServer(app);

    initSocket(httpServer);

    const server = httpServer.listen(
      env.port,
      () => {
        console.log(
          `API running at http://localhost:${env.port}`,
        );
      },
    );

    const shutdown = async (
      signal: string,
    ) => {
      console.log(`${signal} received`);

      try {
        console.log("Closing Socket.IO...");

        getIO().close();

        server.close(async () => {
          console.log("HTTP server closed");

          await disconnectDatabase();

          console.log("MongoDB disconnected");

          process.exit(0);
        });
      } catch (error) {
        console.error(
          "Error during shutdown:",
          error,
        );

        process.exit(1);
      }
    };

    process.on("SIGTERM", () => {
      void shutdown("SIGTERM");
    });

    process.on("SIGINT", () => {
      void shutdown("SIGINT");
    });
  } catch (error) {
    console.error(
      "Failed to start application:",
      error,
    );

    process.exit(1);
  }
}

void bootstrap();