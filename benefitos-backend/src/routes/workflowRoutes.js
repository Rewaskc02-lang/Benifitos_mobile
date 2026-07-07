const express = require("express");
const router = express.Router();
const workflowCtrl = require("../controllers/workflowController");
const validateProfile = require("../middleware/validateProfile");
const authMiddleware = require("../middleware/authMiddleware");
const rateLimiter = require("../middleware/rateLimiter");

// Secure workflow routes
router.post("/profile", authMiddleware, authMiddleware.authorizeCitizen, rateLimiter.profileLimiter, validateProfile, workflowCtrl.updateProfile);
router.post("/assistant", authMiddleware, authMiddleware.authorizeCitizen, rateLimiter.assistantLimiter, workflowCtrl.handleAssistantStream);
router.post("/workflows/recalculate", authMiddleware, authMiddleware.authorizeCitizen, rateLimiter.profileLimiter, workflowCtrl.triggerWelfareWorkflow);

module.exports = router;
