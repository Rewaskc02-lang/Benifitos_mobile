const express = require("express");
const router = express.Router();
const workflowCtrl = require("../controllers/workflowController");
const validateProfile = require("../middleware/validateProfile");

router.post("/profile", validateProfile, workflowCtrl.updateProfile);
router.post("/assistant", workflowCtrl.handleAssistantStream);

module.exports = router;
