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
  app.listen(PORT, () => {
    console.log(`=============================================================`);
    console.log(
      `🚀 BENEFITOS INTELLIGENCE CORE RUNNING SMOOTHLY ON PORT ${PORT}`,
    );
    console.log(`🤝 Hand this endpoint matrix to antigravity for Expo execution`);
    console.log(`=============================================================`);
  });
}).catch((err) => {
  console.error("FATAL STARTUP ERROR: Database connection failed:", err.message);
  process.exit(1);
});
