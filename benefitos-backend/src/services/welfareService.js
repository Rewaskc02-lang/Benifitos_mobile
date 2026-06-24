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
