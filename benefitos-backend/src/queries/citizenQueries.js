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
    MATCH (c:Citizen {id:$citizenId})

    OPTIONAL MATCH (c)-[:ELIGIBLE_FOR]->(:Scheme)-[:REQUIRES_DOCUMENT]->(req:Document)
    WITH c, [doc IN collect(DISTINCT req) WHERE doc IS NOT NULL] AS requiredDocs

    OPTIONAL MATCH (c)-[:HAS_DOCUMENT]->(owned:Document)
    WITH
      requiredDocs,
      [doc IN collect(DISTINCT owned) WHERE doc IS NOT NULL] AS ownedDocs

    WITH
      requiredDocs,
      ownedDocs,
      [doc IN requiredDocs WHERE doc IN ownedDocs] AS availableDocs,
      [doc IN requiredDocs WHERE NOT doc IN ownedDocs] AS missingDocs

    RETURN {
      total:size(requiredDocs),
      available:[d IN availableDocs | d.name],
      missing:[d IN missingDocs | d.name]
    } AS readiness
    `,
    { citizenId },
  );

exports.findCitizenByEmail = (email) =>
  runQuery(
    `
    MATCH (c:Citizen)
    WHERE toLower(c.email) = toLower($email)
    OPTIONAL MATCH (c)-[:CURRENT_STAGE]->(stage:LifeStage)
    RETURN
      c.id as id,
      c.name as name,
      c.age as age,
      c.income as income,
      c.state as state,
      c.email as email,
      COALESCE(stage.name, c.stage) as stage
    `,
    { email },
  );

exports.findCitizenByIdSecure = (citizenId) =>
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
      c.email as email,
      c.password as password,
      COALESCE(stage.name, c.stage) as stage
    `,
    { citizenId },
  );

exports.updateCitizenPassword = (citizenId, hashedPassword) =>
  runQuery(
    `
    MATCH (c:Citizen {id: $citizenId})
    SET c.password = $hashedPassword, c.updatedAt = datetime()
    RETURN c.id as id
    `,
    { citizenId, hashedPassword },
  );

exports.createCitizenAccount = (citizenId, { name, email, password, age, income, state, stage = "Student" }) =>
  runQuery(
    `
    CREATE (c:Citizen {
      id: $citizenId,
      name: $name,
      email: $email,
      password: $password,
      age: $age,
      income: $income,
      state: $state,
      stage: $stage,
      createdAt: datetime(),
      updatedAt: datetime()
    })
    WITH c
    OPTIONAL MATCH (stageNode:LifeStage) WHERE toLower(stageNode.id) = toLower($stage) OR toLower(stageNode.name) = toLower($stage)
    FOREACH (_ IN CASE WHEN stageNode IS NOT NULL THEN [1] END |
      MERGE (c)-[:CURRENT_STAGE]->(stageNode)
    )
    WITH c
    OPTIONAL MATCH (stateNode:State) WHERE toLower(stateNode.id) = toLower($state) OR toLower(stateNode.name) = toLower($state)
    FOREACH (_ IN CASE WHEN stateNode IS NOT NULL THEN [1] END |
      MERGE (c)-[:RESIDES_IN]->(stateNode)
    )
    RETURN c.id as id, c.name as name, c.email as email
    `,
    {
      citizenId,
      name,
      email,
      password,
      age: age ? Number(age) : null,
      income: income ? Number(income) : null,
      state: state || null,
      stage: stage || "Student"
    },
  );

exports.findSimilarCitizens = (citizenId) =>
  runQuery(
    `
    MATCH (c:Citizen {id: $citizenId})
    MATCH (peer:Citizen)
    WHERE peer.id <> c.id
      AND (peer.state = c.state OR peer.stage = c.stage)
      AND abs(peer.income - c.income) <= 50000
    OPTIONAL MATCH (peer)-[:BENEFITTING_FROM]->(s:Scheme)
    WHERE s IS NOT NULL AND NOT (c)-[:BENEFITTING_FROM]->(s)
    RETURN peer.id as peerId, peer.name as peerName, collect(DISTINCT s.name) as peerSchemes
    LIMIT 5
    `,
    { citizenId }
  );

exports.getGraphNodesAndRelationships = (citizenId) =>
  runQuery(
    `
    MATCH (c:Citizen {id: $citizenId})
    OPTIONAL MATCH (c)-[:BELONGS_TO]->(f:Family)
    OPTIONAL MATCH (c)-[:CURRENT_STAGE]->(l:LifeStage)
    OPTIONAL MATCH (c)-[:RESIDES_IN]->(st:State)
    
    OPTIONAL MATCH (c)-[r4:HAS_DOCUMENT]->(doc:Document)
    WITH c, f, l, st, collect(DISTINCT case when doc is not null then { id: doc.id, name: doc.name, verified: coalesce(r4.verified, false) } end) as rawDocs
    
    OPTIONAL MATCH (c)-[r5:BENEFITTING_FROM|ELIGIBLE_FOR|RECOMMENDED_SCHEME]->(sch:Scheme)
    WITH c, f, l, st, rawDocs, collect(DISTINCT case when sch is not null then { id: sch.id, name: sch.name, benefit: sch.financialBenefit, type: type(r5) } end) as rawSchemes
    
    RETURN
      c.id as citizenId,
      c.name as citizenName,
      f.id as familyId,
      f.name as familyName,
      l.id as stageId,
      l.name as stageName,
      st.id as stateId,
      st.name as stateName,
      [x IN rawDocs WHERE x IS NOT NULL] as documents,
      [y IN rawSchemes WHERE y IS NOT NULL] as schemes
    `,
    { citizenId }
  );

exports.getPredictiveEligibility = (citizenId) =>
  runQuery(
    `
    MATCH (c:Citizen {id: $citizenId})
    OPTIONAL MATCH (c)-[:RESIDES_IN]->(state:State)
    OPTIONAL MATCH (c)-[:CURRENT_STAGE]->(currStage:LifeStage)
    MATCH (s:Scheme)
    WHERE (
      NOT EXISTS { MATCH (s)-[:AVAILABLE_IN]->(:State) }
      OR EXISTS { MATCH (s)-[:AVAILABLE_IN]->(state) }
    )
    AND NOT (c)-[:BENEFITTING_FROM]->(s)
    OPTIONAL MATCH (s)-[:REQUIRES_DOCUMENT]->(reqDoc:Document)
    WITH c, s, currStage, collect(DISTINCT reqDoc) as requiredDocs
    WITH c, s, currStage, requiredDocs,
         [doc IN requiredDocs WHERE NOT (c)-[:HAS_DOCUMENT]->(doc)] as missingDocs
    OPTIONAL MATCH (s)-[:TARGETS_STAGE]->(targetStage:LifeStage)
    WITH c, s, currStage, missingDocs, targetStage,
         (targetStage IS NOT NULL AND (currStage IS NULL OR currStage.id <> targetStage.id)) as lifestageMismatch
    WHERE c.age >= s.minAge AND c.age <= s.maxAge
      AND c.income <= s.maxIncome
      AND (size(missingDocs) > 0 OR lifestageMismatch)
    RETURN
      s.name as schemeName,
      s.financialBenefit as benefitAmount,
      [doc IN missingDocs | doc.name] as missingDocuments,
      CASE WHEN lifestageMismatch THEN targetStage.name ELSE null END as requiredLifestage
    ORDER BY benefitAmount DESC
    LIMIT 10
    `,
    { citizenId }
  );

