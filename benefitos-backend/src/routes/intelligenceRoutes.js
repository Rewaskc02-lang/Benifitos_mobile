const express = require("express");
const router = express.Router();
const intelCtrl = require("../controllers/intelligenceController");

router.get("/welfare-score/:citizenId", intelCtrl.getWelfareScore);
router.get("/missed-benefits/:citizenId", intelCtrl.getMissedBenefits);
router.get("/readiness/:citizenId", intelCtrl.getDocumentReadiness);
router.get("/roadmap/:citizenId", intelCtrl.getRoadmap);
router.get("/family-optimizer/:citizenId", intelCtrl.getFamilyOptimization);

module.exports = router;
