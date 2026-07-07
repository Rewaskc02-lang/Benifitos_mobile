const jwt = require("jsonwebtoken");
require("dotenv").config();

const JWT_SECRET = process.env.JWT_SECRET;

const verifyToken = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Unauthorized access. No token provided." });
  }

  const token = authHeader.split(" ")[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded; // holds id, email
    next();
  } catch (err) {
    console.error("JWT Verification error:", err.message);
    return res.status(401).json({ error: "Unauthorized access. Invalid or expired token." });
  }
};

verifyToken.authorizeCitizen = (req, res, next) => {
  const citizenId = req.params.citizenId || req.body.citizenId;
  if (citizenId && req.user && citizenId !== req.user.id) {
    return res.status(403).json({ error: "Access denied. Cannot access another citizen's data." });
  }
  if (!req.params.citizenId && req.body && req.user) {
    req.body.citizenId = req.user.id;
  }
  next();
};

module.exports = verifyToken;
