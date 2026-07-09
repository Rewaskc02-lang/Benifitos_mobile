const citizenQueries = require("../queries/citizenQueries");
const documentIntelligence = require("./documentIntelligenceService");
const roadmapService = require("./roadmapService");
const welfareService = require("./welfareService");
const OCRProvider = require("./ocr/OCRProvider");

const DEFAULT_CITIZEN_ID = "citizen_101";

exports.DEFAULT_CITIZEN_ID = DEFAULT_CITIZEN_ID;

exports.getCitizenProfile = async (citizenId = DEFAULT_CITIZEN_ID) => {
  const result = await citizenQueries.findCitizenById(citizenId);
  return result[0] || null;
};

exports.updateProfileWorkflow = async (body) => {
  const citizenId = body.citizenId || DEFAULT_CITIZEN_ID;
  const profile = {
    name: body.name,
    age: Number(body.age),
    income: Number(body.income),
    state: body.state,
    stage: body.stage,
  };

  await citizenQueries.upsertCitizenProfile(citizenId, profile);

  if (body.verifyDomicile) {
    await citizenQueries.verifyDocumentForCitizen(
      citizenId,
      "Domicile Certificate",
    );
  }

  await exports.recalculateEligibility(citizenId);
  await exports.refreshRoadmapRelationships(citizenId);
  await exports.refreshRecommendationRelationships(citizenId);

  return {
    status: "Success",
    message: "Profile updated and state recalculations executed.",
  };
};

exports.getDocumentReadiness = async (citizenId) => {
  const result = await citizenQueries.getDocumentReadiness(citizenId);

  if (!result[0]) {
    const notFound = new Error("Citizen not found");
    notFound.statusCode = 404;
    throw notFound;
  }

  const readiness = result[0].readiness || {};

  const total = typeof readiness.total === "number" ? readiness.total : 0;

  const available = Array.isArray(readiness.available)
    ? readiness.available
    : [];

  const missing = Array.isArray(readiness.missing) ? readiness.missing : [];
  const readinessPercentage =
    total > 0 ? Math.round((available.length / total) * 100) : 100;

  return {
    total,
    readinessPercentage,
    available: available.map((name) => ({ name, verified: true })),
    missing: missing.map((name) => ({
      name,
      actionRequired: "Upload high-resolution image asset layer.",
    })),
  };
};

exports.recalculateEligibility = (citizenId) =>
  welfareService.recalculateEligibility(citizenId);

exports.refreshRoadmapRelationships = (citizenId) =>
  roadmapService.refreshRoadmapRelationships(citizenId);

exports.refreshRecommendationRelationships = (citizenId) =>
  welfareService.refreshRecommendationRelationships(citizenId);

exports.getGraphVisual = async (citizenId) => {
  const result = await citizenQueries.getGraphNodesAndRelationships(citizenId);
  return (
    result[0] || {
      citizenId,
      citizenName: "Unknown",
      documents: [],
      schemes: [],
    }
  );
};

exports.getSimilarCitizens = async (citizenId) => {
  const similar = await citizenQueries.findSimilarCitizens(citizenId);
  return { similar };
};

exports.getPredictiveEligibility = async (citizenId) => {
  const predictions = await citizenQueries.getPredictiveEligibility(citizenId);
  return { predictions };
};

exports.verifyDocumentWorkflow = async (citizenId, documentName, upload = {}) => {
  let { file, ocrText, ocrConfidence } = upload;

  // Run backend OCR text extraction if not manually passed by the client/tests
  if (file && !ocrText) {
    const ocrResult = await OCRProvider.extractText(file);
    ocrText = ocrResult.text;
    ocrConfidence = ocrResult.confidence;
  }

  const validation = documentIntelligence.validateUploadedDocument({
    file,
    documentName,
    ocrText,
    ocrConfidence,
  });

  if (!validation.valid) {
    const err = new Error(validation.reason || "Document validation failed.");
    err.statusCode = 400;
    err.details = validation;
    console.log("[Document Intelligence] Validation result", { valid: false, reason: err.message });
    throw err;
  }

  await citizenQueries.verifyDocumentForCitizen(citizenId, validation.canonicalName);
  console.log("[Document Intelligence] Neo4j updated", {
    citizenId,
    documentName: validation.canonicalName,
  });

  const workflowService = require("./workflowService");
  console.log("[Document Intelligence] Workflow triggered", { citizenId });
  const recalculationResult = await workflowService.runRecalculationWorkflowForCitizen(citizenId);
  const readiness = await exports.getDocumentReadiness(citizenId);
  console.log("[Document Intelligence] Document Readiness refreshed", readiness);
  console.log("[Document Intelligence] Welfare Score refreshed");
  console.log("[Document Intelligence] Roadmap refreshed");
  console.log("[Document Intelligence] Graph refreshed");
  console.log("[Document Intelligence] Notifications generated", {
    count: recalculationResult.notificationsGenerated,
  });
  return {
    status: "Success",
    message: `Document "${validation.canonicalName}" verified successfully. Welfare score recalculated.`,
    document: {
      name: validation.canonicalName,
      classification: validation.classification,
      fields: validation.fields,
    },
    readiness,
    notificationsGenerated: recalculationResult.notificationsGenerated
  };
};

exports.preprocessDocumentWorkflow = async (file) => {
  if (!file || !file.path) {
    throw new Error("No file uploaded for preprocessing.");
  }
  return OCRProvider.preprocessImage(file.path);
};
