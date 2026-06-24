const familyQueries = require("../queries/familyQueries");

exports.getFamilyOptimization = async (citizenId) => {
  const familyUniverse = await familyQueries.getFamilyOptimization(citizenId);
  return { familyUniverse };
};
