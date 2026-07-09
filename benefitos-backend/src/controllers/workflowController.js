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
    console.log("[Assistant] Incoming query", {
      citizenId: req.body?.citizenId,
      queryLength: (req.body?.message || req.body?.question || "").length,
      historyCount: Array.isArray(req.body?.history) ? req.body.history.length : 0,
    });
    const result = await assistantService.generateAssistantResponse(req.body);
    res.json(result);
  } catch (err) {
    next(err);
  }
};

exports.handleTranscribe = async (req, res, next) => {
  try {
    const { audio, languageCode } = req.body;
    const transcript = await assistantService.transcribeAudio(audio, languageCode);
    res.json({ transcript });
  } catch (err) {
    next(err);
  }
};

exports.handleSynthesize = async (req, res, next) => {
  try {
    const { text, targetLanguageCode } = req.body;
    const audio = await assistantService.synthesizeSpeech(text, targetLanguageCode);
    res.json({ audio });
  } catch (err) {
    next(err);
  }
};

exports.verifyDocument = async (req, res, next) => {
  try {
    const { citizenId, documentName, ocrText, ocrConfidence } = req.body;
    const result = await citizenService.verifyDocumentWorkflow(citizenId, documentName, {
      file: req.file,
      ocrText,
      ocrConfidence,
    });
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

exports.preprocessDocument = async (req, res, next) => {
  try {
    const result = await citizenService.preprocessDocumentWorkflow(req.file);
    res.json(result);
  } catch (err) {
    next(err);
  }
};
