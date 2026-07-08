const express = require("express");
const router = express.Router();
const notifCtrl = require("../controllers/notificationController");
const authMiddleware = require("../middleware/authMiddleware");
const rateLimiter = require("../middleware/rateLimiter");

// Secure notification endpoints
router.get("/notifications/:citizenId", authMiddleware, authMiddleware.authorizeCitizen, rateLimiter.graphLimiter, notifCtrl.getNotifications);
router.put("/notifications/read-all/:citizenId", authMiddleware, authMiddleware.authorizeCitizen, rateLimiter.graphLimiter, notifCtrl.markAllRead);
router.put("/notifications/:notificationId/read", authMiddleware, rateLimiter.graphLimiter, notifCtrl.markRead);
router.delete("/notifications/:notificationId", authMiddleware, rateLimiter.graphLimiter, notifCtrl.deleteNotification);

module.exports = router;
