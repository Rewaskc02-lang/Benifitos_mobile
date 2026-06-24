const { runQuery } = require("../config/db");

exports.getRoadmap = (citizenId) =>
  runQuery(
    `
    MATCH (c:Citizen {id: $citizenId})-[:CURRENT_STAGE]->(curr:LifeStage)
    OPTIONAL MATCH (curr)-[:LEADS_TO]->(next:LifeStage)
    OPTIONAL MATCH (opp:Scheme)-[:TARGETS_STAGE]->(next)
    RETURN
      curr.name as currentStage,
      COALESCE(next.name, "Terminal State") as nextStage,
      collect(opp.name) as opportunities
    `,
    { citizenId },
  );

exports.refreshRoadmapRelationships = (citizenId) =>
  runQuery(
    `
    MATCH (c:Citizen {id: $citizenId})-[:CURRENT_STAGE]->(curr:LifeStage)
    OPTIONAL MATCH (c)-[old:NEXT_ROADMAP_STAGE]->(:LifeStage)
    DELETE old
    WITH c, curr
    OPTIONAL MATCH (curr)-[:LEADS_TO]->(next:LifeStage)
    FOREACH (_ IN CASE WHEN next IS NULL THEN [] ELSE [1] END |
      MERGE (c)-[:NEXT_ROADMAP_STAGE]->(next)
    )
    RETURN COALESCE(next.name, "Terminal State") as nextStage
    `,
    { citizenId },
  );
