import http from "http";
import app from "./app.js";
import { env } from "./config/env.js";
import { connectDatabase, disconnectDatabase } from "./config/database.js";
import { initSocket, getIO } from "./socket/socket.js";

async function bootstrap() {
  await connectDatabase();

  const httpServer = http.createServer(app);

  initSocket(httpServer);

  const server = httpServer.listen(env.port, () => {
    console.log(`API running at http://localhost:${env.port}`);
  });

  const shutdown = async (signal: string) => {
    console.log(`${signal} received`);

    getIO().close();

    server.close(async () => {
      await disconnectDatabase();

      process.exit(0);
    });
  };

  process.on("SIGTERM", () => void shutdown("SIGTERM"));
  process.on("SIGINT", () => void shutdown("SIGINT"));
}

bootstrap().catch((error) => {
  console.error("Failed to start application:", error);

  process.exit(1);
});
