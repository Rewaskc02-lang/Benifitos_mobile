const { runQuery } = require("../config/db");

exports.getFamilyOptimization = (citizenId) =>
  runQuery(
    `
    MATCH (c:Citizen {id: $citizenId})

OPTIONAL MATCH (c)-[:BELONGS_TO]->(family:Family)

OPTIONAL MATCH (member:Citizen)-[belongs:BELONGS_TO]->(family)
    OPTIONAL MATCH (member)-[:BENEFITTING_FROM]->(active:Scheme)
    WITH c, member, belongs, collect(DISTINCT active.name) as activeBenefits
    OPTIONAL MATCH (member)-[:CURRENT_STAGE]->(memberStage:LifeStage)
    WITH member, belongs, activeBenefits, memberStage
    WHERE member IS NOT NULL
    OPTIONAL MATCH (candidate:Scheme)
    WHERE member.income <= candidate.maxIncome
      AND member.age >= candidate.minAge
      AND member.age <= candidate.maxAge
      AND (
        NOT EXISTS {
          MATCH (candidate)-[:AVAILABLE_IN]->(:State)
        }
        OR EXISTS {
          MATCH (candidate)-[:AVAILABLE_IN]->(:State {name: member.state})
        }
      )
      AND (
        memberStage IS NULL
        OR NOT EXISTS {
          MATCH (candidate)-[:TARGETS_STAGE]->(:LifeStage)
        }
        OR EXISTS {
          MATCH (candidate)-[:TARGETS_STAGE]->(memberStage)
        }
      )
      AND NOT (member)-[:BENEFITTING_FROM]->(candidate)
    WITH member, belongs, activeBenefits, collect(DISTINCT candidate.name) as optimizedRecommendations,
      COALESCE(sum(candidate.financialBenefit), 0) as potentialExtraValue
    RETURN
      COALESCE(belongs.relationship, member.relationship, member.name) as familyMember,
      member.age as age,
      activeBenefits,
      optimizedRecommendations,
      potentialExtraValue
    ORDER BY familyMember ASC
    `,
    { citizenId },
  );

exports.getHouseholdGroupOptimization = (citizenId) =>
  runQuery(
    `
    MATCH (c:Citizen {id: $citizenId})

OPTIONAL MATCH (c)-[:BELONGS_TO]->(family:Family)

OPTIONAL MATCH (member:Citizen)-[:BELONGS_TO]->(family)
OPTIONAL MATCH (member)-[:CURRENT_STAGE]->(stage:LifeStage)

WITH
  family,
  collect(
    CASE
      WHEN member IS NOT NULL THEN {
        id: member.id,
        name: member.name,
        age: member.age,
        income: coalesce(member.income, 0),
        stage: stage.id
      }
    END
  ) AS rawMembers

WITH
  family,
  members,
  reduce(total = 0, m IN members | total + m.income) AS totalFamilyIncome

RETURN
  COALESCE(family.name, "No Family") AS familyName,
  totalFamilyIncome,
  size([m IN members WHERE m.stage = "student"]) > 0 AS hasStudent,
  size([m IN members WHERE m.stage = "senior-citizen"]) > 0 AS hasSenior,
  CASE
    WHEN totalFamilyIncome <= 400000
         AND size(members) > 0
    THEN ["Rashtriya Parivar Sahayata Yojana (Combined Income Benefit)"]
    ELSE []
  END AS familyLevelRecommendations
    `,
    { citizenId },
  );
