const citizenService = require("../services/citizenService");
const familyService = require("../services/familyService");
const roadmapService = require("../services/roadmapService");
const welfareService = require("../services/welfareService");

// Contract 1: Live Graph Welfare Score Calculation
exports.getWelfareScore = async (req, res, next) => {
  try {
    const { citizenId } = req.params;
    const result = await welfareService.getWelfareScore(citizenId);
    res.json(result);
  } catch (err) {
    next(err);
  }
};

// Contract 2: Live Missed Benefits Detection Engine
exports.getMissedBenefits = async (req, res, next) => {
  try {
    const { citizenId } = req.params;
    const result = await welfareService.getMissedBenefits(citizenId);
    res.json(result);
  } catch (err) {
    next(err);
  }
};

// Contract 3: Document Readiness Tracker
exports.getDocumentReadiness = async (req, res, next) => {
  try {
    const { citizenId } = req.params;
    const result = await citizenService.getDocumentReadiness(citizenId);
    res.json(result);
  } catch (err) {
    next(err);
  }
};

// Contract 4: Predictive Next-Stage Roadmap Engine
exports.getRoadmap = async (req, res, next) => {
  try {
    const { citizenId } = req.params;
    const result = await roadmapService.getRoadmap(citizenId);
    res.json(result);
  } catch (err) {
    next(err);
  }
};

exports.getFamilyOptimization = async (req, res, next) => {
  try {
    const { citizenId } = req.params;
    const result = await familyService.getFamilyOptimization(citizenId);
    res.json(result);
  } catch (err) {
    next(err);
  }
};
