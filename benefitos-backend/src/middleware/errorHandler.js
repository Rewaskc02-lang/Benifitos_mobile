module.exports = (err, req, res, next) => {
  const statusCode = err.statusCode || err.status || 500;

  if (err instanceof SyntaxError && "body" in err) {
    return res.status(400).json({ error: "Malformed JSON payload" });
  }

  if (statusCode === 404) {
    return res.status(404).json({ error: err.message || "Not found" });
  }

  if (err.code || err.name === "Neo4jError") {
    console.error("Neo4j error:", err.code || err.message);
  } else {
    console.error("Unhandled error:", err.message);
  }

  return res.status(500).json({ error: "Internal server error" });
};
