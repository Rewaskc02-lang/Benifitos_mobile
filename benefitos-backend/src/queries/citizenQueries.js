const { runQuery } = require("../config/db");

exports.findCitizenById = (citizenId) =>
  runQuery(
    `
    MATCH (c:Citizen {id: $citizenId})
    OPTIONAL MATCH (c)-[:CURRENT_STAGE]->(stage:LifeStage)
    RETURN
      c.id as id,
      c.name as name,
      c.age as age,
      c.income as income,
      c.state as state,
      COALESCE(stage.name, c.stage) as stage
    `,
    { citizenId },
  );

exports.upsertCitizenProfile = (citizenId, profile) =>
  runQuery(
    `
    MERGE (c:Citizen {id: $citizenId})
    SET
      c.name = $name,
      c.age = $age,
      c.income = $income,
      c.state = $state,
      c.stage = $stage,
      c.updatedAt = datetime()
    WITH c
    MERGE (stage:LifeStage {name: $stage})
    ON CREATE SET stage.id = toLower(replace($stage, " ", "-"))
    WITH c, stage
    MERGE (state:State {name: $state})
    ON CREATE SET state.id = toUpper(replace($state, " ", "_"))
    WITH c, stage, state
    OPTIONAL MATCH (c)-[oldStage:CURRENT_STAGE]->(:LifeStage)
    DELETE oldStage
    WITH c, stage, state
    OPTIONAL MATCH (c)-[oldState:RESIDES_IN]->(:State)
    DELETE oldState
    WITH c, stage, state
    MERGE (c)-[:CURRENT_STAGE]->(stage)
    MERGE (c)-[:RESIDES_IN]->(state)
    RETURN c.id as id
    `,
    { citizenId, ...profile },
  );

exports.verifyDocumentForCitizen = (citizenId, documentName) =>
  runQuery(
    `
    MATCH (c:Citizen {id: $citizenId})
    MERGE (d:Document {name: $documentName})
    ON CREATE SET d.id = toLower(replace($documentName, " ", "-"))
    MERGE (c)-[:HAS_DOCUMENT {verified: true}]->(d)
    RETURN d.name as name
    `,
    { citizenId, documentName },
  );

exports.getDocumentReadiness = (citizenId) =>
  runQuery(
    `
    MATCH (c:Citizen {id: $citizenId})
    WITH c
    OPTIONAL MATCH (d:Document)
    WITH c, collect(d) as allDocs
    OPTIONAL MATCH (c)-[:HAS_DOCUMENT]->(owned:Document)
    WITH allDocs, collect(owned) as ownedDocs
    RETURN
      size(allDocs) as total,
      [doc IN ownedDocs WHERE doc IS NOT NULL | doc.name] as available,
      [doc IN allDocs WHERE NOT doc IN ownedDocs | doc.name] as missing
    `,
    { citizenId },
  );
