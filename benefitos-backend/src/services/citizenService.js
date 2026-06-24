const citizenQueries = require("../queries/citizenQueries");
const roadmapService = require("./roadmapService");
const welfareService = require("./welfareService");

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

  const total = result[0].total || 1;
  const available = result[0].available || [];
  const missing = result[0].missing || [];

  return {
    readinessPercentage: Math.round((available.length / total) * 100),
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
