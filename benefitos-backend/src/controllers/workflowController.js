const assistantService = require("../services/assistantService");
const citizenService = require("../services/citizenService");
const workflowService = require("../services/workflowService");

// Triggers real-time mutations to test frontend interactivity flows
exports.updateProfile = async (req, res, next) => {
  try {
    const result = await citizenService.updateProfileWorkflow(req.body);
    res.json(result);
  } catch (err) {
    next(err);
  }
};

// Sarvam Voice / Text Assistant Stream Simulation Layer
exports.handleAssistantStream = async (req, res, next) => {
  try {
    const result = await assistantService.generateAssistantResponse(req.body);
    res.json(result);
  } catch (err) {
    next(err);
  }
};

exports.triggerWelfareWorkflow = async (req, res, next) => {
  try {
    const citizenId = req.body.citizenId;
    const result = await workflowService.runRecalculationWorkflowForCitizen(citizenId);
    res.json(result);
  } catch (err) {
    next(err);
  }
};
