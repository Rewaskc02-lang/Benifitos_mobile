const familyQueries = require("../queries/familyQueries");

exports.getFamilyOptimization = async (citizenId) => {
  const familyUniverse = await familyQueries.getFamilyOptimization(citizenId);
  const householdRes = await familyQueries.getHouseholdGroupOptimization(citizenId);
  const householdOptimization = householdRes[0] || {
    familyName: "Household",
    totalFamilyIncome: 0,
    intergenerationalBonusEligible: false,
    familyLevelRecommendations: []
  };
  return { familyUniverse, householdOptimization };
};
