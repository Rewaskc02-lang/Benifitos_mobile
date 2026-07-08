const citizenService = require("./citizenService");
const welfareService = require("./welfareService");
const roadmapService = require("./roadmapService");
const familyService = require("./familyService");
require("dotenv").config();

exports.generateAssistantResponse = async ({
  citizenId = "citizen_101",
  message,
  question,
}) => {
  const queryText = message || question;
  if (!queryText || !queryText.trim()) {
    return { answer: "Please ask a question so I can assist you." };
  }

  // 1. Intent Detection
  const msgLower = queryText.toLowerCase();
  const intents = [];
  if (
    msgLower.includes("score") ||
    msgLower.includes("welfare") ||
    msgLower.includes("points") ||
    msgLower.includes("rating")
  ) {
    intents.push("welfare-score");
  }
  if (
    msgLower.includes("missed") ||
    msgLower.includes("eligible") ||
    msgLower.includes("apply") ||
    msgLower.includes("qualify") ||
    msgLower.includes("recommend") ||
    msgLower.includes("scheme")
  ) {
    intents.push("missed-benefits");
  }
  if (
    msgLower.includes("roadmap") ||
    msgLower.includes("future") ||
    msgLower.includes("milestone") ||
    msgLower.includes("stage") ||
    msgLower.includes("next")
  ) {
    intents.push("roadmap");
  }
  if (
    msgLower.includes("family") ||
    msgLower.includes("household") ||
    msgLower.includes("member") ||
    msgLower.includes("father") ||
    msgLower.includes("mother")
  ) {
    intents.push("family-optimizer");
  }
  if (
    msgLower.includes("predict") ||
    msgLower.includes("document") ||
    msgLower.includes("missing") ||
    msgLower.includes("upload")
  ) {
    intents.push("predictive-eligibility");
  }

  // If no specific intent is found, fetch core profile and basic status
  if (intents.length === 0) {
    intents.push("welfare-score");
    intents.push("missed-benefits");
  }

  // 2. Neo4j Context Retrieval
  const contextData = {};
  try {
    const profiles = await citizenService.getCitizenProfile(citizenId);
    contextData.profile = profiles;

    if (intents.includes("welfare-score")) {
      contextData.welfareScore =
        await welfareService.getWelfareScore(citizenId);
    }
    if (intents.includes("missed-benefits")) {
      contextData.missedBenefits =
        await welfareService.getMissedBenefits(citizenId);
    }
    if (intents.includes("roadmap")) {
      contextData.roadmap = await roadmapService.getRoadmap(citizenId);
    }
    if (intents.includes("family-optimizer")) {
      contextData.family = await familyService.getFamilyOptimization(citizenId);
    }
    if (intents.includes("predictive-eligibility")) {
      contextData.predictions =
        await citizenService.getPredictiveEligibility(citizenId);
    }
  } catch (dbErr) {
    console.error("Neo4j Context retrieval error:", dbErr.message);
    throw new Error(
      `Failed to retrieve citizen context from database: ${dbErr.message}`,
    );
  }

  // 3. Context Builder
  let contextString = `Citizen Profile:
- ID: ${contextData.profile?.id || citizenId}
- Name: ${contextData.profile?.name || "Unknown"}
- Age: ${contextData.profile?.age || "N/A"}
- Annual Income: ₹${contextData.profile?.income ?? "N/A"}
- State: ${contextData.profile?.state || "N/A"}
- Life Stage: ${contextData.profile?.stage || "N/A"}
`;

  if (contextData.welfareScore) {
    contextString += `\nWelfare Score Status:
- Health Score: ${contextData.welfareScore.score}/100
- Current Draw Value: ₹${contextData.welfareScore.currentBenefits}
- Potential Max Value: ₹${contextData.welfareScore.potentialBenefits}
`;
  }

  if (contextData.missedBenefits) {
    contextString += `\nMissed/Recommended Schemes:
${(contextData.missedBenefits?.missedSchemes ?? []).map((s, idx) => `${idx + 1}. ${s.name} (Amount: ₹${s.benefitAmount}). Reason: ${s.reason}`).join("\n") || "No missed schemes found."}
`;
  }

  if (contextData.roadmap) {
    contextString += `\nRoadmap Milestone:
- Current Stage: ${contextData.roadmap.currentStage}
- Next Stage Transition: ${contextData.roadmap.nextStage}
- Opportunities at Next Stage: ${(contextData.roadmap?.opportunities ?? []).join(", ") || "None"}
`;
  }

  if (contextData.family) {
    contextString += `\nFamily Members Optimization Matrix:
${(contextData.family?.familyUniverse ?? []).map((m) => `- Member (${m.familyMember}), Age: ${m.age}. Enrolled: [${(m.activeBenefits ?? []).join(", ")}], Potential: [${(m.optimizedRecommendations ?? []).join(", ")}] (Net Potential: ₹${m.potentialExtraValue})`).join("\n")}
`;
    if (contextData.family.householdOptimization) {
      const hh = contextData.family.householdOptimization;
      contextString += `- Household Level Recommendations: ${(hh.familyLevelRecommendations ?? []).join(", ") || "None"} (Joint Income Support Scheme Eligibility: ${hh.intergenerationalBonusEligible ? "Yes" : "No"})
`;
    }
  }

  if (contextData.predictions) {
    contextString += `\nPredictive Eligibility (Future Schemes if conditions change):
${(contextData.predictions?.predictions ?? []).map((p, idx) => `${idx + 1}. Scheme: ${p.schemeName} (₹${p.benefitAmount}). Missing Requirements: ${(p.missingDocuments ?? []).length > 0 ? "Documents: " + (p.missingDocuments ?? []).join(", ") : ""} ${p.requiredLifestage ? "Transition to Stage: " + p.requiredLifestage : ""}`).join("\n") || "No predicted future schemes."}
`;
  }

  const systemPrompt = `You are the AI Welfare Twin, a personalized welfare intelligence agent.
You are helping a citizen understand their profile, eligibility, welfare score, missed schemes, and roadmap opportunities.
Use ONLY the following graph data retrieved from the Neo4j database to answer the user's question.
Never make up or hallucinate any numbers, schemes, or requirements that are not in the context.
Your answers should be highly detailed, natural, multilingual (responsive in the user's language or mixed Hinglish if appropriate), and must include a clear bulleted explanation of the requirements and reasoning (e.g. checkmarks indicating income, age, residence, document requirements).

Neo4j Graph Context:
${contextString}`;

  // 4. Sarvam AI Chat completion call
  const sarvamKey = process.env.SARVAM_API_KEY;
  if (!sarvamKey) {
    return {
      answer:
        "The AI assistant is currently unavailable because the API key is not configured.",
    };
  }

  let attempts = 0;
  const maxAttempts = 3;
  let response;
  let lastErr = null;


  while (attempts < maxAttempts) {
    const controller = new AbortController();
    const timeoutVal = 35000; // Increased to 35s to prevent timeouts during complex RAG synthesis
    const timeoutId = setTimeout(() => controller.abort(), timeoutVal);
    const startTime = Date.now();
    const targetUrl = "https://api.sarvam.ai/v1/chat/completions";
    const targetModel = process.env.SARVAM_MODEL || "sarvam-30b";

    try {
      console.log(`[Sarvam AI] [Request Start] URL: ${targetUrl}, Model: ${targetModel}, Query Length: ${queryText.length}, Attempt: ${attempts + 1}`);
      response = await fetch(targetUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "api-subscription-key": sarvamKey,
        },
        body: JSON.stringify({
          model: targetModel,
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: queryText },
          ],
          temperature: 0.1,
        }),
        signal: controller.signal,
      });

      const duration = Date.now() - startTime;
      console.log(`[Sarvam AI] [Request Duration] ${duration}ms`);
      console.log(`[Sarvam AI] [HTTP Status] ${response.status}`);

      if (response.ok) {
        if (typeof response.clone === "function") {
          const clone = response.clone();
          const successBody = await clone.text().catch(() => "");
          console.log(`[Sarvam AI] [Response Body] ${successBody}`);
        } else {
          console.log(`[Sarvam AI] [Response Body] (Body cloning not supported on mock response)`);
        }
        break; // break loop on success
      }

      const statusText = response.statusText;
      const errBody = await response.text().catch(() => "");
      console.log(`[Sarvam AI] [Response Body (Error)] ${errBody}`);
      lastErr = new Error(
        `Status ${response.status} ${statusText}: ${errBody}`,
      );
      console.warn(
        `[Sarvam AI] Attempt ${attempts + 1} failed: ${lastErr.message}`,
      );
    } catch (apiErr) {
      lastErr = apiErr;
      const duration = Date.now() - startTime;
      console.error(`[Sarvam AI] [Exception] Duration: ${duration}ms, Message: ${apiErr.message}`);
      console.error(`[Sarvam AI] [Stack Trace] ${apiErr.stack}`);

      if (apiErr.name === "AbortError") {
        console.error(`[Sarvam AI] Request timed out after ${timeoutVal / 1000} seconds.`);
        break;
      }
      console.warn(
        `[Sarvam AI] Attempt ${attempts + 1} network/system error: ${apiErr.message}`,
      );
    } finally {
      clearTimeout(timeoutId);
    }
    attempts++;
    if (attempts < maxAttempts) {
      // Exponential backoff: 1s, 2s
      await new Promise((resolve) => setTimeout(resolve, 1000 * attempts));
    }
  }

  if (!response || !response.ok) {
    const finalMsg = lastErr
      ? lastErr.message
      : "Request failed after all retry attempts.";

    console.error(`[Sarvam AI] ${finalMsg}`);

    return {
      answer:
        "I'm unable to contact the AI service right now. Please try again in a few moments.",
    };
  }

  try {
    let data;

    try {
      data = await response.json();
    } catch {
      return {
        answer:
          "The AI service returned an unexpected response. Please try again later.",
      };
    }
    if (!data.choices || data.choices.length === 0) {
      throw new Error("Sarvam AI returned an empty completions choices array.");
    }

    return {
      answer:
        data?.choices?.[0]?.message?.content ??
        "I couldn't generate a response at the moment.",
    };
  } catch (parseErr) {
    console.error("[Sarvam AI] Response parse error:", parseErr.message);
    throw new Error(
      `Failed to process Sarvam AI response: ${parseErr.message}`,
    );
  }
};

exports.transcribeAudio = async (audioBase64, languageCode = "hi-IN") => {
  const sarvamKey = process.env.SARVAM_API_KEY;
  if (!sarvamKey) {
    throw new Error("Sarvam API key is not configured.");
  }
  if (!audioBase64) {
    throw new Error("No audio payload provided.");
  }

  const audioBuffer = Buffer.from(audioBase64, "base64");
  const fileBlob = new Blob([audioBuffer], { type: "audio/mp4" });
  const form = new FormData();
  form.append("file", fileBlob, "recording.m4a");
  form.append("model", "saaras:v3");
  form.append("language_code", languageCode);
  form.append("mode", "transcribe");

  let attempts = 0;
  const maxAttempts = 3;
  let lastErr = null;

  while (attempts < maxAttempts) {
    try {
      console.log(`[Sarvam STT] Backend calling transcription API, attempt ${attempts + 1}...`);
      const response = await fetch("https://api.sarvam.ai/speech-to-text", {
        method: "POST",
        headers: {
          "api-subscription-key": sarvamKey,
        },
        body: form,
      });

      if (!response.ok) {
        const bodyText = await response.text().catch(() => "");
        throw new Error(`STT API status ${response.status}: ${bodyText}`);
      }

      const data = await response.json();
      const transcript = data.transcript || data.text;
      if (!transcript) {
        throw new Error("Sarvam STT returned empty transcript.");
      }
      return transcript.trim();
    } catch (err) {
      lastErr = err;
      console.warn(`[Sarvam STT] Attempt ${attempts + 1} failed: ${err.message}`);
      attempts++;
      if (attempts < maxAttempts) {
        await new Promise((resolve) => setTimeout(resolve, 1000 * attempts));
      }
    }
  }
  throw new Error(`Speech-to-Text transcription failed: ${lastErr.message}`);
};

exports.synthesizeSpeech = async (text, targetLanguageCode = "hi-IN") => {
  const sarvamKey = process.env.SARVAM_API_KEY;
  if (!sarvamKey) {
    throw new Error("Sarvam API key is not configured.");
  }
  if (!text || !text.trim()) {
    throw new Error("Cannot synthesize empty text.");
  }

  let attempts = 0;
  const maxAttempts = 3;
  let lastErr = null;

  while (attempts < maxAttempts) {
    try {
      console.log(`[Sarvam TTS] Backend calling speech synthesis API, attempt ${attempts + 1}...`);
      const response = await fetch("https://api.sarvam.ai/text-to-speech", {
        method: "POST",
        headers: {
          "api-subscription-key": sarvamKey,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          text: text.trim(),
          target_language_code: targetLanguageCode,
          model: "bulbul:v3",
          output_audio_codec: "wav",
        }),
      });

      if (!response.ok) {
        const bodyText = await response.text().catch(() => "");
        throw new Error(`TTS API status ${response.status}: ${bodyText}`);
      }

      const data = await response.json();
      const audioBase64 = data.audios && data.audios[0];
      if (!audioBase64) {
        throw new Error("Sarvam TTS returned no audio data.");
      }
      return audioBase64;
    } catch (err) {
      lastErr = err;
      console.warn(`[Sarvam TTS] Attempt ${attempts + 1} failed: ${err.message}`);
      attempts++;
      if (attempts < maxAttempts) {
        await new Promise((resolve) => setTimeout(resolve, 1000 * attempts));
      }
    }
  }
  throw new Error(`Text-to-Speech synthesis failed: ${lastErr.message}`);
};
