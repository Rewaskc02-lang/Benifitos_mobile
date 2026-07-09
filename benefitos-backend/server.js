// Process crash monitors
process.on("unhandledRejection", (reason, promise) => {
  console.error("[Fatal Error] Unhandled promise rejection at:", promise, "reason:", reason);
});

process.on("uncaughtException", (error) => {
  console.error("[Fatal Error] Uncaught exception:", error.message, error.stack);
  process.exit(1);
});

require("dotenv").config();

const requiredEnv = [
  "JWT_SECRET",
  "SARVAM_API_KEY",
  "NEO4J_URI",
  "NEO4J_USER",
  "NEO4J_PASSWORD"
];

for (const env of requiredEnv) {
  if (!process.env[env] || process.env[env].trim() === "") {
    console.error(`FATAL STARTUP ERROR: Environment variable ${env} is missing.`);
    process.exit(1);
  }
}

const app = require("./src/app");
const db = require("./src/config/db");

const PORT = process.env.PORT || 5001;

db.validateConnection().then(() => {
  const server = app.listen(PORT, () => {
    console.log(`=============================================================`);
    console.log(
      `🚀 BENEFITOS INTELLIGENCE CORE RUNNING SMOOTHLY ON PORT ${PORT}`,
    );
    console.log(`🤝 Hand this endpoint matrix to antigravity for Expo execution`);
    console.log(`=============================================================`);
  });

  // Handle port conflicts EADDRINUSE gracefully
  server.on("error", (err) => {
    if (err.code === "EADDRINUSE") {
      console.error(`[Startup Error] Port ${PORT} is already in use. Clean shutdown.`);
      process.exit(1);
    } else {
      console.error(`[Server Error] Encountered server exception:`, err.message);
    }
  });

  // Graceful shutdown procedure
  const shutdown = async (signal) => {
    console.log(`\n[Shutdown] Received signal ${signal}. Starting graceful shutdown...`);
    server.close(async () => {
      console.log("[Shutdown] HTTP server closed.");
      await db.closeDriver().catch(err => {
        console.error("[Shutdown] Error closing database driver:", err.message);
      });
      console.log("[Shutdown] Database connection driver closed successfully. Safe exit.");
      process.exit(0);
    });

    // Force exit after 5 seconds if connection is hanging
    setTimeout(() => {
      console.error("[Shutdown] Force exit after timeout.");
      process.exit(1);
    }, 5000).unref();
  };

  process.on("SIGTERM", () => shutdown("SIGTERM"));
  process.on("SIGINT", () => shutdown("SIGINT"));
}).catch((err) => {
  console.error("FATAL STARTUP ERROR: Database connection failed:", err.message);
  process.exit(1);
});
