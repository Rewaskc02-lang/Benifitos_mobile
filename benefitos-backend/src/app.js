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
  const status = dbHealth.status === "UP" ? "GREEN" : "RED";
  res.status(dbHealth.status === "UP" ? 200 : 503).json({
    status,
    engine: "BenefitOS Core Engine Active",
    database: dbHealth,
  });
});

app.use(errorHandler);

module.exports = app;
