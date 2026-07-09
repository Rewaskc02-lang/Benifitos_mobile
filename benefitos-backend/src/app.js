const express = require("express");
const cors = require("cors");
const intelRoutes = require("./routes/intelligenceRoutes");
const workflowRoutes = require("./routes/workflowRoutes");
const authRoutes = require("./routes/authRoutes");
const notificationRoutes = require("./routes/notificationRoutes");
const errorHandler = require("./middleware/errorHandler");

const app = express();

const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(",")
  : ["http://localhost:8081", "http://localhost:19006"];

const corsOptions = {
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    if (allowedOrigins.indexOf(origin) !== -1 || process.env.NODE_ENV === "development" || process.env.NODE_ENV === "test") {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS policy"));
    }
  },
  credentials: true,
  optionsSuccessStatus: 200
};

app.use(cors(corsOptions));
app.use(express.json());

// Bind versioned paths
app.use("/api", intelRoutes);
app.use("/api", workflowRoutes);
app.use("/api", authRoutes);
app.use("/api", notificationRoutes);

const db = require("./config/db");

// Base Health Check Route
app.get("/health", async (req, res) => {
  const dbHealth = await db.checkHealth();
  const dbStatus = dbHealth.status === "UP" ? "GREEN" : "RED";
  
  // Verify Sarvam AI configuration and connectivity
  let sarvamStatus = "RED";
  let sarvamMsg = "Sarvam AI API key is not configured.";
  
  const sarvamKey = process.env.SARVAM_API_KEY;
  if (sarvamKey && sarvamKey.trim() !== "") {
    if (process.env.NODE_ENV === "test") {
      sarvamStatus = "GREEN";
      sarvamMsg = "Mock Sarvam AI active (test environment)";
    } else {
      try {
        const response = await fetch("https://api.sarvam.ai/v1/chat/completions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "api-subscription-key": sarvamKey,
          },
          body: JSON.stringify({
            model: process.env.SARVAM_MODEL || "sarvam-30b",
            messages: [{ role: "user", content: "ping" }],
            max_tokens: 1,
          }),
        });
        if (response.ok) {
          sarvamStatus = "GREEN";
          sarvamMsg = "Sarvam AI Service is active and authorized.";
        } else {
          const errText = await response.text().catch(() => "");
          sarvamMsg = `Sarvam AI returned status ${response.status}: ${errText}`;
        }
      } catch (err) {
        sarvamMsg = `Sarvam AI is unreachable: ${err.message}`;
      }
    }
  }

  const overallStatus = (dbStatus === "GREEN" && sarvamStatus === "GREEN") ? "GREEN" : "RED";

  res.status(overallStatus === "GREEN" ? 200 : 503).json({
    status: overallStatus,
    engine: "BenefitOS Core Engine Active",
    database: dbHealth,
    sarvam: {
      status: sarvamStatus,
      message: sarvamMsg,
    },
    environment: {
      nodeEnv: process.env.NODE_ENV || "development",
      port: process.env.PORT || 5001,
      renderLoaded: !!(process.env.RENDER_SERVICE_ID || process.env.RENDER_API_KEY),
    }
  });
});

app.use(errorHandler);

module.exports = app;
