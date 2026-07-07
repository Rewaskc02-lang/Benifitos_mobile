const express = require("express");
const router = express.Router();
const authCtrl = require("../controllers/authController");
const authMiddleware = require("../middleware/authMiddleware");

const rateLimiter = require("../middleware/rateLimiter");

// Public routes
router.post("/auth/register", rateLimiter.authLimiter, authCtrl.register);
router.post("/auth/login", rateLimiter.authLimiter, authCtrl.login);
router.post("/auth/logout", authCtrl.logout);

// Protected routes
router.get("/auth/me", authMiddleware, authCtrl.getMe);
router.put("/auth/me", authMiddleware, authCtrl.updateName);
router.put("/auth/password", authMiddleware, authCtrl.changePassword);

module.exports = router;
