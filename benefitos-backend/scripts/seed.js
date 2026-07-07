const neo4j = require("neo4j-driver");
const bcrypt = require("bcryptjs");
require("dotenv").config();

const driver = neo4j.driver(
  process.env.NEO4J_URI,
  neo4j.auth.basic(process.env.NEO4J_USER, process.env.NEO4J_PASSWORD),
);

const hashedPass = bcrypt.hashSync("password123", 10);

const states = [
  { id: "UP", name: "Uttar Pradesh" },
  { id: "KA", name: "Karnataka" },
];

const documents = [
  { id: "doc-aadhaar", name: "Aadhaar Card" },
  { id: "doc-income", name: "Income Certificate" },
  { id: "doc-domicile", name: "Domicile Certificate" },
  { id: "doc-bank", name: "Bank Account" },
  { id: "doc-land", name: "Land Record" },
  { id: "doc-age", name: "Age Proof" },
];

const lifeStages = [
  { id: "student", name: "Student", nextId: "graduate" },
  { id: "graduate", name: "Graduate", nextId: "worker" },
  { id: "worker", name: "Worker", nextId: "senior-citizen" },
  { id: "farmer", name: "Farmer", nextId: "senior-citizen" },
  { id: "homemaker", name: "Homemaker", nextId: "worker" },
  { id: "senior-citizen", name: "Senior Citizen", nextId: null },
];

const schemes = [
  {
    id: "sch-001",
    name: "UP Post-Matric Scholarship Scheme",
    financialBenefit: 20000,
    minAge: 16,
    maxAge: 30,
    maxIncome: 250000,
    documentIds: ["doc-income", "doc-domicile"],
    stageIds: ["student"],
    stateIds: ["UP"],
  },
  {
    id: "sch-002",
    name: "Farmer Input Subsidy",
    financialBenefit: 15000,
    minAge: 18,
    maxAge: 70,
    maxIncome: 300000,
    documentIds: ["doc-aadhaar", "doc-bank", "doc-land"],
    stageIds: ["farmer"],
    stateIds: ["UP"],
  },
  {
    id: "sch-003",
    name: "Senior Citizen Pension",
    financialBenefit: 24000,
    minAge: 60,
    maxAge: 120,
    maxIncome: 300000,
    documentIds: ["doc-aadhaar", "doc-age", "doc-bank"],
    stageIds: ["senior-citizen"],
    stateIds: ["UP"],
  },
  {
    id: "sch-004",
    name: "State Startup Grant",
    financialBenefit: 50000,
    minAge: 21,
    maxAge: 40,
    maxIncome: 600000,
    documentIds: ["doc-aadhaar", "doc-bank", "doc-domicile"],
    stageIds: ["graduate", "worker"],
    stateIds: ["UP", "KA"],
  },
  {
    id: "sch-005",
    name: "National Means Scholarship",
    financialBenefit: 12000,
    minAge: 12,
    maxAge: 25,
    maxIncome: 180000,
    documentIds: ["doc-aadhaar", "doc-income"],
    stageIds: ["student"],
    stateIds: [],
  },
];

const families = [{ id: "family_101", name: "Kumar Household" }];

const citizens = [
  {
    id: "citizen_100",
    name: "Mahesh Kumar",
    age: 52,
    income: 140000,
    state: "Uttar Pradesh",
    stateId: "UP",
    stageId: "farmer",
    familyId: "family_101",
    relationship: "Father",
    documentIds: ["doc-aadhaar", "doc-bank"],
    activeSchemeIds: [],
    email: "mahesh@benefitos.dev",
    password: hashedPass,
  },
  {
    id: "citizen_102",
    name: "Sunita Devi",
    age: 48,
    income: 0,
    state: "Uttar Pradesh",
    stateId: "UP",
    stageId: "homemaker",
    familyId: "family_101",
    relationship: "Mother",
    documentIds: ["doc-aadhaar", "doc-income"],
    activeSchemeIds: [],
    email: "sunita@benefitos.dev",
    password: hashedPass,
  },
  {
    id: "citizen_101",
    name: "Rajesh Kumar",
    age: 21,
    income: 180000,
    state: "Uttar Pradesh",
    stateId: "UP",
    stageId: "student",
    familyId: "family_101",
    relationship: "Student",
    documentIds: ["doc-aadhaar", "doc-income"],
    activeSchemeIds: ["sch-005"],
    email: "rajesh@benefitos.dev",
    password: hashedPass,
  },
  {
    id: "citizen_103",
    name: "Kamla Devi",
    age: 74,
    income: 90000,
    state: "Uttar Pradesh",
    stateId: "UP",
    stageId: "senior-citizen",
    familyId: "family_101",
    relationship: "Grandmother",
    documentIds: ["doc-aadhaar", "doc-age"],
    activeSchemeIds: [],
    email: "kamla@benefitos.dev",
    password: hashedPass,
  },
];

const seed = async () => {
  const session = driver.session();

  try {
    await session.executeWrite((tx) =>
      tx.run(
        `
        UNWIND $states as state
        MERGE (s:State {id: state.id})
        SET s.name = state.name
        `,
        { states },
      ),
    );

    await session.executeWrite((tx) =>
      tx.run(
        `
        UNWIND $documents as doc
        MERGE (d:Document {id: doc.id})
        SET d.name = doc.name
        `,
        { documents },
      ),
    );

    await session.executeWrite((tx) =>
      tx.run(
        `
        UNWIND $lifeStages as stage
        MERGE (l:LifeStage {id: stage.id})
        SET l.name = stage.name
        `,
        { lifeStages },
      ),
    );

    await session.executeWrite((tx) =>
      tx.run(
        `
        UNWIND $lifeStages as stage
        MATCH (current:LifeStage {id: stage.id})
        MATCH (next:LifeStage {id: stage.nextId})
        MERGE (current)-[:LEADS_TO]->(next)
        `,
        { lifeStages: lifeStages.filter((stage) => stage.nextId) },
      ),
    );

    await session.executeWrite((tx) =>
      tx.run(
        `
        UNWIND $schemes as scheme
        MERGE (s:Scheme {id: scheme.id})
        SET
          s.name = scheme.name,
          s.financialBenefit = scheme.financialBenefit,
          s.minAge = scheme.minAge,
          s.maxAge = scheme.maxAge,
          s.maxIncome = scheme.maxIncome
        WITH s, scheme
        OPTIONAL MATCH (s)-[oldDoc:REQUIRES_DOCUMENT]->(:Document)
        DELETE oldDoc
        WITH s, scheme
        OPTIONAL MATCH (s)-[oldStage:TARGETS_STAGE]->(:LifeStage)
        DELETE oldStage
        WITH s, scheme
        OPTIONAL MATCH (s)-[oldState:AVAILABLE_IN]->(:State)
        DELETE oldState
        WITH s, scheme
        UNWIND scheme.documentIds as documentId
        MATCH (d:Document {id: documentId})
        MERGE (s)-[:REQUIRES_DOCUMENT]->(d)
        WITH DISTINCT s, scheme
        UNWIND scheme.stageIds as stageId
        MATCH (stage:LifeStage {id: stageId})
        MERGE (s)-[:TARGETS_STAGE]->(stage)
        WITH DISTINCT s, scheme
        UNWIND scheme.stateIds as stateId
        MATCH (state:State {id: stateId})
        MERGE (s)-[:AVAILABLE_IN]->(state)
        `,
        { schemes },
      ),
    );

    await session.executeWrite((tx) =>
      tx.run(
        `
        UNWIND $families as family
        MERGE (f:Family {id: family.id})
        SET f.name = family.name
        `,
        { families },
      ),
    );

    await session.executeWrite((tx) =>
      tx.run(
        `
        UNWIND $citizens as citizen
        MATCH (family:Family {id: citizen.familyId})
        MATCH (stage:LifeStage {id: citizen.stageId})
        MATCH (state:State {id: citizen.stateId})
        MERGE (c:Citizen {id: citizen.id})
        SET
          c.name = citizen.name,
          c.age = citizen.age,
          c.income = citizen.income,
          c.state = citizen.state,
          c.stage = stage.name,
          c.email = citizen.email,
          c.password = citizen.password
        WITH c, citizen, family, stage, state
        OPTIONAL MATCH (c)-[oldFamily:BELONGS_TO]->(:Family)
        DELETE oldFamily
        WITH c, citizen, family, stage, state
        OPTIONAL MATCH (c)-[oldStage:CURRENT_STAGE]->(:LifeStage)
        DELETE oldStage
        WITH c, citizen, family, stage, state
        OPTIONAL MATCH (c)-[oldState:RESIDES_IN]->(:State)
        DELETE oldState
        WITH c, citizen, family, stage, state
        OPTIONAL MATCH (c)-[oldDoc:HAS_DOCUMENT]->(:Document)
        DELETE oldDoc
        WITH c, citizen, family, stage, state
        OPTIONAL MATCH (c)-[oldBenefit:BENEFITTING_FROM]->(:Scheme)
        DELETE oldBenefit
        WITH c, citizen, family, stage, state
        MERGE (c)-[belongs:BELONGS_TO]->(family)
        SET belongs.relationship = citizen.relationship
        MERGE (c)-[:CURRENT_STAGE]->(stage)
        MERGE (c)-[:RESIDES_IN]->(state)
        WITH c, citizen
        UNWIND citizen.documentIds as documentId
        MATCH (d:Document {id: documentId})
        MERGE (c)-[:HAS_DOCUMENT {verified: true}]->(d)
        WITH DISTINCT c, citizen
        UNWIND citizen.activeSchemeIds as schemeId
        MATCH (s:Scheme {id: schemeId})
        MERGE (c)-[:BENEFITTING_FROM]->(s)
        `,
        { citizens },
      ),
    );

    console.log("BenefitOS demo graph seeded successfully.");
  } finally {
    await session.close();
    await driver.close();
  }
};

seed().catch(async (err) => {
  console.error("Seed failed:", err.message);
  await driver.close();
  process.exit(1);
});
