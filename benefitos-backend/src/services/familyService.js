const familyQueries = require("../queries/familyQueries");

exports.getFamilyOptimization = async (citizenId) => {
  const familyUniverse = await familyQueries.getFamilyOptimization(citizenId);
  const householdRes = await familyQueries.getHouseholdGroupOptimization(citizenId);
  const householdOptimization = {
    familyName: householdRes[0]?.familyName || "Household",
    totalFamilyIncome: householdRes[0]?.totalFamilyIncome || 0,
    intergenerationalBonusEligible: householdRes[0]?.intergenerationalBonusEligible !== undefined
      ? householdRes[0].intergenerationalBonusEligible
      : !!(householdRes[0]?.hasStudent && householdRes[0]?.hasSenior),
    familyLevelRecommendations: householdRes[0]?.familyLevelRecommendations || []
  };
  return { familyUniverse, householdOptimization };
};
