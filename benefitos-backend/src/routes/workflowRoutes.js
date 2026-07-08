const express = require("express");
const router = express.Router();
const workflowCtrl = require("../controllers/workflowController");
const validateProfile = require("../middleware/validateProfile");
const authMiddleware = require("../middleware/authMiddleware");
const rateLimiter = require("../middleware/rateLimiter");

const multer = require("multer");
const upload = multer({ dest: "uploads/" });

// Secure workflow routes
router.post("/profile", authMiddleware, authMiddleware.authorizeCitizen, rateLimiter.profileLimiter, validateProfile, workflowCtrl.updateProfile);
router.post("/assistant", authMiddleware, authMiddleware.authorizeCitizen, rateLimiter.assistantLimiter, workflowCtrl.handleAssistantStream);
router.post("/assistant/transcribe", authMiddleware, authMiddleware.authorizeCitizen, rateLimiter.assistantLimiter, workflowCtrl.handleTranscribe);
router.post("/assistant/synthesize", authMiddleware, authMiddleware.authorizeCitizen, rateLimiter.assistantLimiter, workflowCtrl.handleSynthesize);
router.post("/documents/verify", authMiddleware, authMiddleware.authorizeCitizen, rateLimiter.profileLimiter, upload.single("file"), workflowCtrl.verifyDocument);
router.post("/workflows/recalculate", authMiddleware, authMiddleware.authorizeCitizen, rateLimiter.profileLimiter, workflowCtrl.triggerWelfareWorkflow);

module.exports = router;
