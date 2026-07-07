const assert = require("node:assert/strict");
const http = require("node:http");
const Module = require("node:module");
const test = require("node:test");

process.env.NODE_ENV = "test";
process.env.JWT_SECRET = "test_jwt_secret_must_be_long_and_secure_value";
process.env.SARVAM_API_KEY = "test_sarvam_api_key_placeholder";
process.env.NEO4J_URI = "neo4j+s://727e7d7c.databases.neo4j.io";
process.env.NEO4J_USER = "727e7d7c";
process.env.NEO4J_PASSWORD = "8v_gV3QPv7dkQJKFztrLpca3cqpk9g0nlB0o9LPATtA";

const originalFetch = globalThis.fetch;
globalThis.fetch = async function (url, options) {
  if (typeof url === "string" && url.includes("api.sarvam.ai")) {
    return {
      ok: true,
      status: 200,
      json: async () => ({
        choices: [
          {
            message: {
              content: "Here is your explainable response showing that you qualify for UP Post-Matric Scholarship Scheme. ✓ Income below threshold. ✓ Resident of Uttar Pradesh.",
            },
          },
        ],
      }),
    };
  }
  return originalFetch.apply(this, arguments);
};

let mode = "success";

async function mockRunQuery(query, params = {}) {
  if (mode === "db-error") {
    const err = new Error("Neo4j unavailable");
    err.code = "ServiceUnavailable";
    throw err;
  }

  if (params.citizenId === "missing") return [];

  if (query.includes("getGraphNodesAndRelationships") || query.includes("coalesce(r4.verified")) {
    return [
      {
        citizenId: "citizen_101",
        citizenName: "Rajesh Kumar",
        familyId: "family_101",
        familyName: "Kumar Household",
        stageId: "student",
        stageName: "Student",
        stateId: "UP",
        stateName: "Uttar Pradesh",
        documents: [{ id: "doc-aadhaar", name: "Aadhaar Card", verified: true }],
        schemes: [{ id: "sch-005", name: "National Means Scholarship", benefit: 12000, type: "BENEFITTING_FROM" }]
      }
    ];
  }

  if (query.includes("getPredictiveEligibility") || query.includes("missingDocs, targetStage")) {
    return [
      {
        schemeName: "UP Post-Matric Scholarship Scheme",
        benefitAmount: 20000,
        missingDocuments: ["Domicile Certificate"],
        requiredLifestage: null
      }
    ];
  }

  if (query.includes("findSimilarCitizens") || query.includes("peer.id <> c.id")) {
    return [
      { peerId: "citizen_102", peerName: "Sunita Devi", peerSchemes: ["Rashtriya Parivar Sahayata Yojana"] }
    ];
  }

  if (query.includes("findSimilarSchemes") || query.includes("similar.id <> s.id")) {
    return [
      { id: "sch-001", name: "UP Post-Matric Scholarship Scheme", benefitAmount: 20000 }
    ];
  }

  if (query.includes("checkExplainableEligibility") || query.includes("c.age >= s.minAge AND c.age <= s.maxAge as ageValid")) {
    return [
      {
        citizenId: "citizen_101",
        schemeId: "sch-005",
        name: "National Means Scholarship",
        ageValid: true,
        citizenAge: 21,
        minAge: 12,
        maxAge: 25,
        incomeValid: true,
        citizenIncome: 180000,
        maxIncome: 180000,
        stateValid: true,
        citizenState: "Uttar Pradesh",
        stageValid: true,
        citizenStage: "Student"
      }
    ];
  }

  if (query.includes("getHouseholdGroupOptimization") || query.includes("totalFamilyIncome")) {
    return [
      {
        familyName: "Kumar Household",
        totalFamilyIncome: 320000,
        intergenerationalBonusEligible: true,
        familyLevelRecommendations: ["Rashtriya Parivar Sahayata Yojana (Combined Income Benefit)"]
      }
    ];
  }


  if (query.includes("potentialMax as potentialBenefits")) {
    return [{ score: 50, currentBenefits: 12000, potentialBenefits: 24000 }];
  }

  if (query.includes("ORDER BY benefitAmount DESC")) {
    return [
      {
        id: "sch-001",
        name: "UP Post-Matric Scholarship Scheme",
        benefitAmount: 20000,
        reason: "Missing documents: Domicile Certificate",
      },
    ];
  }

  if (query.includes("size(allDocs) as total") || query.includes("size(requiredDocs) as total") || query.includes("readiness")) {
    return [
      {
        readiness: {
          total: 3,
          available: ["Aadhaar Card", "Income Certificate"],
          missing: ["Domicile Certificate"],
        }
      },
    ];
  }

  if (query.includes("curr.name as currentStage")) {
    return [
      {
        currentStage: "Student",
        nextStage: "Graduate",
        opportunities: ["State Startup Grant"],
      },
    ];
  }

  if (query.includes("potentialExtraValue")) {
    return [
      {
        familyMember: "Student",
        age: 21,
        activeBenefits: ["National Means Scholarship"],
        optimizedRecommendations: ["UP Post-Matric Scholarship Scheme"],
        potentialExtraValue: 20000,
      },
    ];
  }

  if (query.includes("c.password as password")) {
    const bcrypt = require("bcryptjs");
    const dummyHash = bcrypt.hashSync("password123", 10);
    return [
      {
        id: "citizen_101",
        name: "Rajesh Kumar",
        age: 21,
        income: 180000,
        state: "Uttar Pradesh",
        email: "rajesh@benefitos.dev",
        password: dummyHash,
        stage: "Student",
      },
    ];
  }

  if (query.includes("toLower(c.email) = toLower($email)")) {
    if (params.email === "rajesh@benefitos.dev") {
      return [
        {
          id: "citizen_101",
          name: "Rajesh Kumar",
          age: 21,
          income: 180000,
          state: "Uttar Pradesh",
          email: "rajesh@benefitos.dev",
          stage: "Student",
        },
      ];
    }
    return [];
  }

  if (query.includes("c.id as id") && query.includes("COALESCE(stage.name")) {
    return [
      {
        id: "citizen_101",
        name: "Rajesh Kumar",
        age: 21,
        income: 180000,
        state: "Uttar Pradesh",
        stage: "Student",
        email: "rajesh@benefitos.dev",
      },
    ];
  }

  if (query.includes("CREATE (c)-[:HAS_NOTIFICATION]->(n:Notification")) {
    return [
      {
        id: params.id,
        type: params.type,
        title: params.title,
        message: params.message,
        read: false,
        createdAt: "2026-07-06T15:43:20Z"
      }
    ];
  }

  if (query.includes("MATCH (c:Citizen { id: $citizenId })-[:HAS_NOTIFICATION]->(n:Notification)")) {
    return [
      {
        id: "notif_001",
        type: "newly_eligible",
        title: "New Scheme Unlocked! 🎉",
        message: "You are newly eligible to apply for Scheme UP.",
        read: false,
        createdAt: "2026-07-06T15:43:20Z"
      }
    ];
  }

  if (query.includes("SET n.read = true")) {
    if (params.notificationId === "notif_missing") return [];
    return [
      {
        id: params.notificationId,
        type: "newly_eligible",
        title: "New Scheme Unlocked! 🎉",
        message: "You are newly eligible to apply for Scheme UP.",
        read: true,
        createdAt: "2026-07-06T15:43:20Z"
      }
    ];
  }

  if (query.includes("DETACH DELETE n")) {
    if (params.notificationId === "notif_missing") return [];
    return [{ deletedId: params.notificationId }];
  }

  if (query.includes("MATCH (c:Citizen) RETURN c.id")) {
    return [{ id: "citizen_101" }];
  }

  if (query.includes("CREATE (c:Citizen {")) {
    return [
      {
        id: params.citizenId || "citizen_new",
        name: params.name,
        email: params.email,
      },
    ];
  }

  return [{ ok: true }];
}

const originalLoad = Module._load;
Module._load = function patchedLoad(request, parent, isMain) {
  if (request === "../config/db" || request.endsWith("/src/config/db")) {
    return {
      runQuery: mockRunQuery,
      closeDriver: async () => {},
    };
  }

  return originalLoad.apply(this, arguments);
};

const app = require("../src/app");

const jwt = require("jsonwebtoken");
const testTokenCitizen101 = jwt.sign({ id: "citizen_101", email: "rajesh@benefitos.dev" }, process.env.JWT_SECRET || "test_jwt_secret_must_be_long_and_secure_value");
const testTokenMissing = jwt.sign({ id: "missing", email: "missing@benefitos.dev" }, process.env.JWT_SECRET || "test_jwt_secret_must_be_long_and_secure_value");

const request = (method, path, body, headers = {}) =>
  new Promise((resolve, reject) => {
    const server = app.listen(0, "127.0.0.1", () => {
      const { port } = server.address();
      const payload = body ? JSON.stringify(body) : null;
      const defaultHeaders = payload
        ? {
            "Content-Type": "application/json",
            "Content-Length": Buffer.byteLength(payload),
          }
        : {};

      // Enforce default JWT tokens on backend tests
      const authHeaders = {};
      const noAuth = headers["No-Auth"];
      delete headers["No-Auth"];
      if (!headers.Authorization && !noAuth && !path.startsWith("/api/auth/register") && !path.startsWith("/api/auth/login") && !path.startsWith("/api/auth/logout") && path !== "/health") {
        if (path.includes("/missing")) {
          authHeaders.Authorization = `Bearer ${testTokenMissing}`;
        } else {
          authHeaders.Authorization = `Bearer ${testTokenCitizen101}`;
        }
      }

      const req = http.request(
        {
          hostname: "127.0.0.1",
          port,
          path,
          method,
          headers: { ...defaultHeaders, ...authHeaders, ...headers },
        },
        (res) => {
          const chunks = [];
          res.on("data", (chunk) => chunks.push(chunk));
          res.on("end", () => {
            server.close();
            const text = Buffer.concat(chunks).toString();
            resolve({
              statusCode: res.statusCode,
              body: text ? JSON.parse(text) : null,
            });
          });
        },
      );

      req.on("error", (err) => {
        server.close();
        reject(err);
      });

      if (payload) req.write(payload);
      req.end();
    });

    server.on("error", reject);
  });

test.after(() => {
  Module._load = originalLoad;
});

test.beforeEach(() => {
  mode = "success";
});

test("GET /api/welfare-score/:citizenId returns existing score shape", async () => {
  const res = await request("GET", "/api/welfare-score/citizen_101");

  assert.equal(res.statusCode, 200);
  assert.deepEqual(res.body, {
    score: 50,
    currentBenefits: 12000,
    potentialBenefits: 24000,
  });
});

test("GET /api/missed-benefits/:citizenId returns missedSchemes without duplicates", async () => {
  const res = await request("GET", "/api/missed-benefits/citizen_101");

  assert.equal(res.statusCode, 200);
  assert.equal(res.body.missedSchemes.length, 1);
  assert.equal(res.body.missedSchemes[0].name, "UP Post-Matric Scholarship Scheme");
});

test("GET /api/readiness/:citizenId returns readiness shape", async () => {
  const res = await request("GET", "/api/readiness/citizen_101");

  assert.equal(res.statusCode, 200);
  assert.equal(res.body.readinessPercentage, 67);
  assert.deepEqual(res.body.available[0], {
    name: "Aadhaar Card",
    verified: true,
  });
});

test("GET /api/readiness/:citizenId returns 404 for missing citizen", async () => {
  const res = await request("GET", "/api/readiness/missing");

  assert.equal(res.statusCode, 404);
  assert.deepEqual(res.body, { error: "Citizen not found" });
});

test("missing citizens keep legacy fallback shapes outside readiness", async () => {
  const welfare = await request("GET", "/api/welfare-score/missing");
  const missed = await request("GET", "/api/missed-benefits/missing");
  const roadmap = await request("GET", "/api/roadmap/missing");
  const family = await request("GET", "/api/family-optimizer/missing");

  assert.equal(welfare.statusCode, 200);
  assert.deepEqual(welfare.body, {
    score: 100,
    currentBenefits: 0,
    potentialBenefits: 0,
  });
  assert.deepEqual(missed.body, { missedSchemes: [] });
  assert.deepEqual(roadmap.body, {
    currentStage: "Unknown",
    nextStage: "N/A",
    opportunities: [],
  });
  assert.deepEqual(family.body, {
    familyUniverse: [],
    householdOptimization: {
      familyName: "Household",
      totalFamilyIncome: 0,
      intergenerationalBonusEligible: false,
      familyLevelRecommendations: []
    }
  });
});

test("GET /api/roadmap/:citizenId returns roadmap shape", async () => {
  const res = await request("GET", "/api/roadmap/citizen_101");

  assert.equal(res.statusCode, 200);
  assert.deepEqual(res.body, {
    currentStage: "Student",
    nextStage: "Graduate",
    opportunities: ["State Startup Grant"],
  });
});

test("GET /api/family-optimizer/:citizenId returns familyUniverse shape", async () => {
  const res = await request("GET", "/api/family-optimizer/citizen_101");

  assert.equal(res.statusCode, 200);
  assert.deepEqual(res.body, {
    familyUniverse: [
      {
        familyMember: "Student",
        age: 21,
        activeBenefits: ["National Means Scholarship"],
        optimizedRecommendations: ["UP Post-Matric Scholarship Scheme"],
        potentialExtraValue: 20000,
      },
    ],
    householdOptimization: {
      familyName: "Kumar Household",
      totalFamilyIncome: 320000,
      intergenerationalBonusEligible: true,
      familyLevelRecommendations: ["Rashtriya Parivar Sahayata Yojana (Combined Income Benefit)"]
    }
  });
});

test("POST /api/profile accepts zero income and preserves response shape", async () => {
  const res = await request("POST", "/api/profile", {
    name: "Sunita Devi",
    age: 48,
    income: 0,
    state: "Uttar Pradesh",
    stage: "Homemaker",
  });

  assert.equal(res.statusCode, 200);
  assert.deepEqual(res.body, {
    status: "Success",
    message: "Profile updated and state recalculations executed.",
  });
});

test("POST /api/profile rejects invalid profile input", async () => {
  const res = await request("POST", "/api/profile", {
    name: "",
    age: 121,
    income: -1,
    state: "",
    stage: "",
  });

  assert.equal(res.statusCode, 400);
  assert.deepEqual(res.body, { error: "Validation failed" });
});

test("POST /api/assistant returns answer shape", async () => {
  const res = await request("POST", "/api/assistant", {
    message: "What should I apply for?",
  });

  assert.equal(res.statusCode, 200);
  assert.equal(typeof res.body.answer, "string");
});

test("database failures are hidden behind global error response", async () => {
  mode = "db-error";
  const res = await request("GET", "/api/welfare-score/citizen_101");

  assert.equal(res.statusCode, 500);
  assert.deepEqual(res.body, { error: "Internal server error" });
});

test("POST /api/auth/register creates account and returns token", async () => {
  const res = await request("POST", "/api/auth/register", {
    name: "New User",
    email: "newuser@benefitos.dev",
    password: "password123",
    age: 25,
    income: 100000,
    state: "Uttar Pradesh",
  });

  assert.equal(res.statusCode, 201);
  assert.equal(typeof res.body.token, "string");
  assert.equal(res.body.user.name, "New User");
  assert.equal(res.body.user.email, "newuser@benefitos.dev");
});

test("POST /api/auth/register rejects existing email", async () => {
  const res = await request("POST", "/api/auth/register", {
    name: "Rajesh Kumar",
    email: "rajesh@benefitos.dev",
    password: "password123",
  });

  assert.equal(res.statusCode, 400);
  assert.deepEqual(res.body, { error: "Email already registered" });
});

test("POST /api/auth/register rejects short password", async () => {
  const res = await request("POST", "/api/auth/register", {
    name: "New User",
    email: "newuser2@benefitos.dev",
    password: "123",
  });

  assert.equal(res.statusCode, 400);
  assert.deepEqual(res.body, { error: "Password must be at least 6 characters" });
});

test("POST /api/auth/register rejects invalid email format", async () => {
  const res = await request("POST", "/api/auth/register", {
    name: "New User",
    email: "invalid-email-format",
    password: "password123",
  });

  assert.equal(res.statusCode, 400);
  assert.deepEqual(res.body, { error: "Invalid email format" });
});

test("POST /api/auth/login logs in user and returns token", async () => {
  const res = await request("POST", "/api/auth/login", {
    email: "rajesh@benefitos.dev",
    password: "password123",
  });

  assert.equal(res.statusCode, 200);
  assert.equal(typeof res.body.token, "string");
  assert.equal(res.body.user.id, "citizen_101");
});

test("POST /api/auth/login rejects wrong credentials", async () => {
  const res = await request("POST", "/api/auth/login", {
    email: "rajesh@benefitos.dev",
    password: "wrongpassword",
  });

  assert.equal(res.statusCode, 401);
  assert.deepEqual(res.body, { error: "Invalid email or password" });
});

test("GET /api/auth/me returns citizen profile", async () => {
  const loginRes = await request("POST", "/api/auth/login", {
    email: "rajesh@benefitos.dev",
    password: "password123",
  });
  const token = loginRes.body.token;

  const res = await request("GET", "/api/auth/me", null, {
    Authorization: `Bearer ${token}`,
  });

  assert.equal(res.statusCode, 200);
  assert.equal(res.body.id, "citizen_101");
  assert.equal(res.body.name, "Rajesh Kumar");
});

test("GET /api/auth/me blocks requests without token", async () => {
  const res = await request("GET", "/api/auth/me", null, { "No-Auth": "true" });

  assert.equal(res.statusCode, 401);
  assert.deepEqual(res.body, { error: "Unauthorized access. No token provided." });
});

test("PUT /api/auth/me updates display name", async () => {
  const loginRes = await request("POST", "/api/auth/login", {
    email: "rajesh@benefitos.dev",
    password: "password123",
  });
  const token = loginRes.body.token;

  const res = await request(
    "PUT",
    "/api/auth/me",
    { name: "Rajesh Kumar Updated" },
    { Authorization: `Bearer ${token}` }
  );

  assert.equal(res.statusCode, 200);
  assert.equal(res.body.name, "Rajesh Kumar Updated");
});

test("PUT /api/auth/password changes password", async () => {
  const loginRes = await request("POST", "/api/auth/login", {
    email: "rajesh@benefitos.dev",
    password: "password123",
  });
  const token = loginRes.body.token;

  const res = await request(
    "PUT",
    "/api/auth/password",
    { oldPassword: "password123", newPassword: "newpassword123" },
    { Authorization: `Bearer ${token}` }
  );

  assert.equal(res.statusCode, 200);
  assert.deepEqual(res.body, { success: true });
});

test("POST /api/auth/logout responds success", async () => {
  const res = await request("POST", "/api/auth/logout");

  assert.equal(res.statusCode, 200);
  assert.deepEqual(res.body, { success: true, message: "Logged out successfully" });
});

test("GET /api/graph-visual/:citizenId returns visualization nodes and links data", async () => {
  const res = await request("GET", "/api/graph-visual/citizen_101");

  assert.equal(res.statusCode, 200);
  assert.equal(res.body.citizenId, "citizen_101");
  assert.equal(res.body.citizenName, "Rajesh Kumar");
  assert.ok(Array.isArray(res.body.documents));
  assert.ok(Array.isArray(res.body.schemes));
});

test("GET /api/similar-citizens/:citizenId returns list of matching peer citizens and schemes", async () => {
  const res = await request("GET", "/api/similar-citizens/citizen_101");

  assert.equal(res.statusCode, 200);
  assert.ok(Array.isArray(res.body.similar));
  assert.equal(res.body.similar[0].peerName, "Sunita Devi");
});

test("GET /api/explain-eligibility/:citizenId/:schemeId returns pass/fail metrics for rules", async () => {
  const res = await request("GET", "/api/explain-eligibility/citizen_101/sch-005");

  assert.equal(res.statusCode, 200);
  assert.equal(res.body.name, "National Means Scholarship");
  assert.equal(res.body.ageValid, true);
  assert.equal(res.body.incomeValid, true);
  assert.equal(res.body.stateValid, true);
});

test("GET /api/predictive-eligibility/:citizenId returns future schemes predictions", async () => {
  const res = await request("GET", "/api/predictive-eligibility/citizen_101");

  assert.equal(res.statusCode, 200);
  assert.ok(Array.isArray(res.body.predictions));
  assert.equal(res.body.predictions[0].schemeName, "UP Post-Matric Scholarship Scheme");
});

test("POST /api/assistant calls Sarvam completions and retrieves Neo4j RAG context", async () => {
  const res = await request("POST", "/api/assistant", {
    message: "What is my welfare score and can you predict any future schemes for me?",
  });

  assert.equal(res.statusCode, 200);
  assert.ok(res.body.answer.includes("✓"));
  assert.ok(res.body.answer.includes("UP Post-Matric Scholarship Scheme"));
});
test("POST /api/workflows/recalculate executes background score and eligibility updates", async () => {
  const res = await request("POST", "/api/workflows/recalculate", {
    citizenId: "citizen_101",
  });

  assert.equal(res.statusCode, 200);
  assert.equal(res.body.status, "Success");
  assert.equal(res.body.citizenId, "citizen_101");
});

test("GET /api/notifications/:citizenId returns list of notifications from Neo4j", async () => {
  const res = await request("GET", "/api/notifications/citizen_101");

  assert.equal(res.statusCode, 200);
  assert.ok(Array.isArray(res.body.notifications));
  assert.equal(res.body.notifications[0].id, "notif_001");
});

test("PUT /api/notifications/:notificationId/read marks notification read in Neo4j", async () => {
  const res = await request("PUT", "/api/notifications/notif_001/read");

  assert.equal(res.statusCode, 200);
  assert.equal(res.body.status, "Success");
  assert.equal(res.body.notification.read, true);
});

test("DELETE /api/notifications/:notificationId deletes notification from Neo4j", async () => {
  const res = await request("DELETE", "/api/notifications/notif_001");

  assert.equal(res.statusCode, 200);
  assert.equal(res.body.status, "Success");
});

test("PUT /api/notifications/:notificationId/read returns 404 for missing notification", async () => {
  const res = await request("PUT", "/api/notifications/notif_missing/read");

  assert.equal(res.statusCode, 404);
  assert.deepEqual(res.body, { error: "Notification not found" });
});

test("DELETE /api/notifications/:notificationId returns 404 for missing notification", async () => {
  const res = await request("DELETE", "/api/notifications/notif_missing");

  assert.equal(res.statusCode, 404);
  assert.deepEqual(res.body, { error: "Notification not found" });
});
