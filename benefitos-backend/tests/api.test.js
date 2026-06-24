const assert = require("node:assert/strict");
const http = require("node:http");
const Module = require("node:module");
const test = require("node:test");

let mode = "success";

async function mockRunQuery(query, params = {}) {
  if (mode === "db-error") {
    const err = new Error("Neo4j unavailable");
    err.code = "ServiceUnavailable";
    throw err;
  }

  if (params.citizenId === "missing") return [];

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

  if (query.includes("size(allDocs) as total")) {
    return [
      {
        total: 3,
        available: ["Aadhaar Card", "Income Certificate"],
        missing: ["Domicile Certificate"],
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

  if (query.includes("c.id as id") && query.includes("COALESCE(stage.name")) {
    return [
      {
        id: "citizen_101",
        name: "Rajesh Kumar",
        age: 21,
        income: 180000,
        state: "Uttar Pradesh",
        stage: "Student",
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

const request = (method, path, body) =>
  new Promise((resolve, reject) => {
    const server = app.listen(0, "127.0.0.1", () => {
      const { port } = server.address();
      const payload = body ? JSON.stringify(body) : null;
      const req = http.request(
        {
          hostname: "127.0.0.1",
          port,
          path,
          method,
          headers: payload
            ? {
                "Content-Type": "application/json",
                "Content-Length": Buffer.byteLength(payload),
              }
            : {},
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
  assert.deepEqual(family.body, { familyUniverse: [] });
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
