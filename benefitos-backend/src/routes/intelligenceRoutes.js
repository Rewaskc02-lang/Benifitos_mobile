const express = require("express");
const router = express.Router();
const intelCtrl = require("../controllers/intelligenceController");
const authMiddleware = require("../middleware/authMiddleware");
const rateLimiter = require("../middleware/rateLimiter");

// Secure all citizen-specific intelligence endpoints
router.get("/welfare-score/:citizenId", authMiddleware, authMiddleware.authorizeCitizen, rateLimiter.graphLimiter, intelCtrl.getWelfareScore);
router.get("/missed-benefits/:citizenId", authMiddleware, authMiddleware.authorizeCitizen, rateLimiter.graphLimiter, intelCtrl.getMissedBenefits);
router.get("/readiness/:citizenId", authMiddleware, authMiddleware.authorizeCitizen, rateLimiter.graphLimiter, intelCtrl.getDocumentReadiness);
router.get("/roadmap/:citizenId", authMiddleware, authMiddleware.authorizeCitizen, rateLimiter.graphLimiter, intelCtrl.getRoadmap);
router.get("/family-optimizer/:citizenId", authMiddleware, authMiddleware.authorizeCitizen, rateLimiter.graphLimiter, intelCtrl.getFamilyOptimization);

// Advanced Graph intelligence endpoints
router.get("/graph-visual/:citizenId", authMiddleware, authMiddleware.authorizeCitizen, rateLimiter.graphLimiter, intelCtrl.getGraphVisual);
router.get("/similar-citizens/:citizenId", authMiddleware, authMiddleware.authorizeCitizen, rateLimiter.graphLimiter, intelCtrl.getSimilarCitizens);
router.get("/explain-eligibility/:citizenId/:schemeId", authMiddleware, authMiddleware.authorizeCitizen, rateLimiter.graphLimiter, intelCtrl.getExplainEligibility);
router.get("/predictive-eligibility/:citizenId", authMiddleware, authMiddleware.authorizeCitizen, rateLimiter.graphLimiter, intelCtrl.getPredictiveEligibility);

module.exports = router;
