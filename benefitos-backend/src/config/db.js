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

module.exports = {
  // Standard secure query session implementation wrapper
  runQuery: async (query, params = {}) => {
    const session = driver.session();
    try {
      const result = await session.run(query, params);
      return result.records.map((record) => toNative(record.toObject()));
    } finally {
      await session.close();
    }
  },
  closeDriver: () => driver.close(),
};
