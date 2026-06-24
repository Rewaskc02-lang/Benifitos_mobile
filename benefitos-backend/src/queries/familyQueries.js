const { runQuery } = require("../config/db");

exports.getFamilyOptimization = (citizenId) =>
  runQuery(
    `
    MATCH (c:Citizen {id: $citizenId})-[:BELONGS_TO]->(family:Family)
    MATCH (member:Citizen)-[belongs:BELONGS_TO]->(family)
    OPTIONAL MATCH (member)-[:BENEFITTING_FROM]->(active:Scheme)
    WITH c, member, belongs, collect(DISTINCT active.name) as activeBenefits
    OPTIONAL MATCH (member)-[:CURRENT_STAGE]->(memberStage:LifeStage)
    WITH member, belongs, activeBenefits, memberStage
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
