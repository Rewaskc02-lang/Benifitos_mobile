const { runQuery } = require("../config/db");

exports.getRoadmap = (citizenId) =>
  runQuery(
    `
    MATCH (c:Citizen {id: $citizenId})-[:CURRENT_STAGE]->(curr:LifeStage)
    OPTIONAL MATCH (c)-[:RESIDES_IN]->(state:State)
    WITH c, curr, state
    OPTIONAL MATCH (curr)-[:LEADS_TO]->(next:LifeStage)
    WITH c, curr, next, state
    OPTIONAL MATCH (opp:Scheme)-[:TARGETS_STAGE]->(next)
    WHERE opp IS NULL OR (
      (c.income <= opp.maxIncome OR opp.maxIncome IS NULL)
      AND (
        NOT EXISTS { MATCH (opp)-[:AVAILABLE_IN]->(:State) }
        OR EXISTS { MATCH (opp)-[:AVAILABLE_IN]->(state) }
      )
    )
    RETURN
      curr.name as currentStage,
      COALESCE(next.name, "Terminal State") as nextStage,
      [x IN collect(opp.name) WHERE x IS NOT NULL] as opportunities
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
