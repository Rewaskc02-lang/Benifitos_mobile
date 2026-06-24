const roadmapQueries = require("../queries/roadmapQueries");

exports.getRoadmap = async (citizenId) => {
  const result = await roadmapQueries.getRoadmap(citizenId);
  return (
    result[0] || {
      currentStage: "Unknown",
      nextStage: "N/A",
      opportunities: [],
    }
  );
};

exports.refreshRoadmapRelationships = (citizenId) =>
  roadmapQueries.refreshRoadmapRelationships(citizenId);
