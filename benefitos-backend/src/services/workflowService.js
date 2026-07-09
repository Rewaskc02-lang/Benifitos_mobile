const db = require("../config/db");
const citizenService = require("./citizenService");
const welfareService = require("./welfareService");
const notificationQueries = require("../queries/notificationQueries");

exports.runRecalculationWorkflowForCitizen = async (citizenId) => {
  console.log(`[Workflow] Starting welfare recalculation for citizen: ${citizenId}`);
  
  // 1. Fetch current eligible schemes before recalculation
  const missedBefore = await welfareService.getMissedBenefits(citizenId).catch(() => ({ missedSchemes: [] }));
  const beforeIds = new Set(missedBefore.missedSchemes.map(s => s.id));

  // 2. Perform graph mutations & refresh relationships
  await citizenService.recalculateEligibility(citizenId);
  await citizenService.refreshRoadmapRelationships(citizenId);
  await citizenService.refreshRecommendationRelationships(citizenId);

  // 3. Fetch eligible schemes after recalculation
  const missedAfter = await welfareService.getMissedBenefits(citizenId).catch(() => ({ missedSchemes: [] }));
  const afterSchemes = missedAfter.missedSchemes;

  // 4. Identify newly unlocked/eligible schemes
  let newNotifsCount = 0;
  for (const scheme of afterSchemes) {
    if (!beforeIds.has(scheme.id)) {
      // Newly eligible scheme!
      await notificationQueries.createNotification(citizenId, {
        type: "newly_eligible",
        title: "New Scheme Unlocked! 🎉",
        message: `You are newly eligible to apply for "${scheme.name}" representing ₹${(scheme.benefitAmount || 0).toLocaleString()} in potential benefits.`,
      }).catch(err => console.error("[Workflow] Failed to save newly_eligible notification:", err.message));
      newNotifsCount++;
    }
  }

  // 5. Check for missing documents and trigger warnings
  const readiness = await citizenService.getDocumentReadiness(citizenId).catch(() => null);
  console.log("[Workflow] Document Readiness refreshed", readiness);
  if (readiness && readiness.missing) {
    for (const doc of readiness.missing) {
      await notificationQueries.createNotification(citizenId, {
        type: "missing_documents",
        title: "Missing Document Alert 📄",
        message: `Upload your verified "${doc.name}" to unlock additional government welfare schemes.`,
      }).catch(err => console.error("[Workflow] Failed to save missing_documents notification:", err.message));
      newNotifsCount++;
    }
  }

  console.log(`[Workflow] Completed successfully for ${citizenId}. Generated ${newNotifsCount} notifications.`);
  return { status: "Success", citizenId, notificationsGenerated: newNotifsCount };
};

exports.runGlobalRecalculationWorkflow = async () => {
  console.log("[Workflow] Starting Global Recalculation Engine background job...");
  const logEntries = [];
  
  // 1. Get all citizen IDs from Neo4j
  let citizens = [];
  try {
    citizens = await db.runQuery("MATCH (c:Citizen) RETURN c.id as id");
  } catch (err) {
    console.error("[Workflow] Failed to fetch citizens list from Neo4j:", err.message);
    throw err;
  }

  const results = [];
  for (const c of citizens) {
    const citizenId = c.id;
    let attempts = 0;
    const maxAttempts = 3;
    let success = false;
    let result = null;

    while (attempts < maxAttempts && !success) {
      try {
        result = await exports.runRecalculationWorkflowForCitizen(citizenId);
        success = true;
        results.push(result);
        logEntries.push(`[Success] Citizen ${citizenId}: recals completed.`);
      } catch (err) {
        attempts++;
        console.warn(`[Workflow] Attempt ${attempts} failed for citizen ${citizenId}: ${err.message}`);
        if (attempts >= maxAttempts) {
          logEntries.push(`[Failure] Citizen ${citizenId}: failed after 3 retries. Error: ${err.message}`);
        } else {
          await new Promise(resolve => setTimeout(resolve, 1000 * attempts));
        }
      }
    }
  }

  console.log(`[Workflow] Global run complete. Processed ${results.length}/${citizens.length} citizens successfully.`);
  return {
    status: "Completed",
    totalCitizens: citizens.length,
    processed: results.length,
    logs: logEntries
  };
};
