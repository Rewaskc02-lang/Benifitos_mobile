const { runQuery } = require("../config/db");

exports.getWelfareScore = (citizenId) =>
  runQuery(
    `
    MATCH (c:Citizen {id: $citizenId})
    OPTIONAL MATCH (c)-[:BENEFITTING_FROM]->(active:Scheme)
    WITH c, COALESCE(SUM(active.financialBenefit), 0) as currentBenefits
    OPTIONAL MATCH (c)-[:CURRENT_STAGE]->(citizenStage:LifeStage)
    WITH c, citizenStage, currentBenefits
    OPTIONAL MATCH (s:Scheme)
    WHERE c.income <= s.maxIncome AND c.age >= s.minAge AND c.age <= s.maxAge
      AND (
        NOT EXISTS {
          MATCH (s)-[:AVAILABLE_IN]->(:State)
        }
        OR EXISTS {
          MATCH (s)-[:AVAILABLE_IN]->(:State {name: c.state})
        }
      )
      AND (
        citizenStage IS NULL
        OR NOT EXISTS {
          MATCH (s)-[:TARGETS_STAGE]->(:LifeStage)
        }
        OR EXISTS {
          MATCH (s)-[:TARGETS_STAGE]->(citizenStage)
        }
      )
    WITH currentBenefits, COALESCE(SUM(s.financialBenefit), 0) as potentialMax
    RETURN
      CASE WHEN potentialMax > 0
        THEN toInteger((toFloat(currentBenefits) / potentialMax) * 100)
        ELSE 100
      END as score,
      currentBenefits,
      potentialMax as potentialBenefits
    `,
    { citizenId },
  );

exports.getMissedBenefits = (citizenId) =>
  runQuery(
    `
    MATCH (c:Citizen {id: $citizenId})
    OPTIONAL MATCH (c)-[:CURRENT_STAGE]->(citizenStage:LifeStage)
    WITH c, citizenStage
    MATCH (s:Scheme)
    WHERE c.income <= s.maxIncome
      AND c.age >= s.minAge
      AND c.age <= s.maxAge
      AND (
        NOT EXISTS {
          MATCH (s)-[:AVAILABLE_IN]->(:State)
        }
        OR EXISTS {
          MATCH (s)-[:AVAILABLE_IN]->(:State {name: c.state})
        }
      )
      AND (
        citizenStage IS NULL
        OR NOT EXISTS {
          MATCH (s)-[:TARGETS_STAGE]->(:LifeStage)
        }
        OR EXISTS {
          MATCH (s)-[:TARGETS_STAGE]->(citizenStage)
        }
      )
      AND NOT (c)-[:BENEFITTING_FROM]->(s)
    OPTIONAL MATCH (s)-[:REQUIRES_DOCUMENT]->(reqDoc:Document)
    WITH c, s, collect(reqDoc) as requiredDocs
    WITH c, s, [doc IN requiredDocs WHERE doc IS NOT NULL AND NOT (c)-[:HAS_DOCUMENT]->(doc)] as missingDocs
    RETURN
      s.id as id,
      s.name as name,
      s.financialBenefit as benefitAmount,
      CASE WHEN size(missingDocs) > 0
        THEN "Missing documents: " + reduce(text = "", doc IN missingDocs |
          text + CASE WHEN text = "" THEN "" ELSE ", " END + doc.name
        )
        ELSE "Eligible but un-applied system node status."
      END as reason
    ORDER BY benefitAmount DESC, name ASC
    `,
    { citizenId },
  );

exports.refreshRecommendationRelationships = (citizenId) =>
  runQuery(
    `
    MATCH (c:Citizen {id: $citizenId})
    OPTIONAL MATCH (c)-[old:RECOMMENDED_SCHEME]->(:Scheme)
    DELETE old
    WITH c
    OPTIONAL MATCH (c)-[:CURRENT_STAGE]->(citizenStage:LifeStage)
    WITH c, citizenStage
    MATCH (s:Scheme)
    WHERE c.income <= s.maxIncome
      AND c.age >= s.minAge
      AND c.age <= s.maxAge
      AND (
        NOT EXISTS {
          MATCH (s)-[:AVAILABLE_IN]->(:State)
        }
        OR EXISTS {
          MATCH (s)-[:AVAILABLE_IN]->(:State {name: c.state})
        }
      )
      AND (
        citizenStage IS NULL
        OR NOT EXISTS {
          MATCH (s)-[:TARGETS_STAGE]->(:LifeStage)
        }
        OR EXISTS {
          MATCH (s)-[:TARGETS_STAGE]->(citizenStage)
        }
      )
      AND NOT (c)-[:BENEFITTING_FROM]->(s)
    MERGE (c)-[:RECOMMENDED_SCHEME]->(s)
    RETURN count(s) as recommendationCount
    `,
    { citizenId },
  );

exports.recalculateEligibility = (citizenId) =>
  runQuery(
    `
    MATCH (c:Citizen {id: $citizenId})
    OPTIONAL MATCH (c)-[old:ELIGIBLE_FOR]->(:Scheme)
    DELETE old
    WITH c
    OPTIONAL MATCH (c)-[:CURRENT_STAGE]->(citizenStage:LifeStage)
    WITH c, citizenStage
    MATCH (s:Scheme)
    WHERE c.income <= s.maxIncome
      AND c.age >= s.minAge
      AND c.age <= s.maxAge
      AND (
        NOT EXISTS {
          MATCH (s)-[:AVAILABLE_IN]->(:State)
        }
        OR EXISTS {
          MATCH (s)-[:AVAILABLE_IN]->(:State {name: c.state})
        }
      )
      AND (
        citizenStage IS NULL
        OR NOT EXISTS {
          MATCH (s)-[:TARGETS_STAGE]->(:LifeStage)
        }
        OR EXISTS {
          MATCH (s)-[:TARGETS_STAGE]->(citizenStage)
        }
      )
    MERGE (c)-[:ELIGIBLE_FOR]->(s)
    RETURN count(s) as eligibleSchemeCount
    `,
    { citizenId },
  );
