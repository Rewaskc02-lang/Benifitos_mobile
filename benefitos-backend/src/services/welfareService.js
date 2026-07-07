const welfareQueries = require("../queries/welfareQueries");

exports.getWelfareScore = async (citizenId) => {
  const result = await welfareQueries.getWelfareScore(citizenId);
  return result[0] || { score: 100, currentBenefits: 0, potentialBenefits: 0 };
};

exports.getMissedBenefits = async (citizenId) => {
  const missedSchemes = await welfareQueries.getMissedBenefits(citizenId);
  return { missedSchemes };
};

exports.recalculateEligibility = (citizenId) =>
  welfareQueries.recalculateEligibility(citizenId);

exports.refreshRecommendationRelationships = (citizenId) =>
  welfareQueries.refreshRecommendationRelationships(citizenId);

exports.getExplainEligibility = async (citizenId, schemeId) => {
  const result = await welfareQueries.checkExplainableEligibility(citizenId, schemeId);
  return result[0] || { citizenId, schemeId, ageValid: false, incomeValid: false, stateValid: false, stageValid: false };
};

exports.getSimilarSchemes = async (schemeId) => {
  const similar = await welfareQueries.findSimilarSchemes(schemeId);
  return { similar };
};

