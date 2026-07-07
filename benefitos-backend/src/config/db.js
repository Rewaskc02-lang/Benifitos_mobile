const neo4j = require("neo4j-driver");
require("dotenv").config();

const driver = neo4j.driver(
  process.env.NEO4J_URI,
  neo4j.auth.basic(process.env.NEO4J_USER, process.env.NEO4J_PASSWORD),
);

const toNative = (value) => {
  if (neo4j.isInt(value)) return value.toNumber();
  if (Array.isArray(value)) return value.map(toNative);
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value).map(([key, nestedValue]) => [
        key,
        toNative(nestedValue),
      ]),
    );
  }
  return value;
};

const validateConnection = async () => {
  if (process.env.NODE_ENV === "test") {
    return;
  }
  
  console.log("[Neo4j] Verifying AuraDB connection...");
  let attempts = 0;
  const maxAttempts = 3;
  while (attempts < maxAttempts) {
    try {
      await driver.verifyConnectivity();
      console.log("[Neo4j] AuraDB Connection validated successfully!");
      return;
    } catch (err) {
      attempts++;
      console.warn(`[Neo4j] Connection attempt ${attempts} failed: ${err.message}`);
      if (attempts < maxAttempts) {
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }
  }
  console.error("[Neo4j] FATAL: Failed to connect to Neo4j AuraDB after 3 attempts.");
  process.exit(1);
};

const checkHealth = async () => {
  if (process.env.NODE_ENV === "test") {
    return { status: "UP", database: "Mock connection active" };
  }
  try {
    const session = driver.session();
    try {
      await session.run("RETURN 1");
      return { status: "UP", database: "Neo4j AuraDB Connected" };
    } finally {
      await session.close();
    }
  } catch (err) {
    return { status: "DOWN", error: err.message };
  }
};

module.exports = {
  validateConnection,
  checkHealth,
  // Standard secure query session implementation wrapper with transient error retries
  runQuery: async (query, params = {}) => {
    let attempts = 0;
    const maxAttempts = 3;
    let lastErr = null;

    while (attempts < maxAttempts) {
      const session = driver.session();
      try {
        const result = await session.run(query, params);
        return result.records.map((record) => toNative(record.toObject()));
      } catch (err) {
        lastErr = err;
        console.warn(`[Neo4j] Query failed on attempt ${attempts + 1}: ${err.message}`);
        
        // Retry only on transient network or session issues
        if (
          err.code === "ServiceUnavailable" ||
          err.code === "SessionExpired" ||
          err.message.includes("connection") ||
          err.message.includes("Socket")
        ) {
          attempts++;
          if (attempts < maxAttempts) {
            await new Promise((resolve) => setTimeout(resolve, 1000 * attempts));
          }
        } else {
          break; // permanent query/syntax error
        }
      } finally {
        await session.close();
      }
    }

    console.error("[Neo4j] Query failed permanently:", lastErr);
    throw new Error("Welfare Graph database is currently busy or unavailable. Please try again shortly.");
  },
  closeDriver: () => driver.close(),
};
