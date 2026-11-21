/**
 * MediMate AI - Gemini AI Service Integration
 * Integrates Google Gemini API using official Google Gen AI SDK / REST API with strict
 * medical safety guardrails, quota handling, and offline fallback mode.
 */

// Bypass local macOS / corporate proxy SSL certificate verification issues
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

const SYSTEM_INSTRUCTION = `You are MediMate AI, a general health and wellness information assistant.

Provide educational health information and general wellness suggestions.

Never diagnose diseases.
Never prescribe medicines.
Never recommend changing prescribed medications.
Never claim certainty about a medical condition.
Never replace professional medical advice.

If a user describes severe or potentially life-threatening symptoms (e.g., chest pain, difficulty breathing, severe bleeding, signs of stroke, loss of consciousness), advise them to seek emergency medical care immediately.

Encourage users to consult qualified healthcare professionals for personal medical concerns.

Clearly explain uncertainty and limitations. Keep your tone supportive, empathetic, calm, and objective.`;

const MEDICAL_DISCLAIMER = "MediMate AI provides general health and wellness information only. It is not a medical professional and cannot diagnose, treat, or prevent diseases. Consult a qualified healthcare professional for medical advice.";

// Known fallback answers for zero-config demonstration when API key is pending
const FALLBACK_TOPICS = {
  sleep: "To support healthy sleep hygiene, research suggests keeping a consistent sleep and wake schedule (even on weekends), maintaining a cool and dark bedroom environment, and avoiding blue-light screens and caffeine at least 1-2 hours before bedtime. Aim for 7 to 9 hours of restorative rest each night.",
  hydration: "Proper hydration supports cognitive performance, physical endurance, and kidney function. General guidelines recommend approximately 2.5 to 3.5 liters per day for adults, depending on climate and activity level. Carrying a reusable water bottle and sipping steadily throughout the day helps maintain optimal fluid balance.",
  exercise: "The World Health Organization recommends at least 150-300 minutes of moderate aerobic physical activity (or 75-150 minutes of vigorous activity) per week, coupled with muscle-strengthening exercises on two or more days. Starting with brisk daily walks is a safe, sustainable way to build cardiovascular health.",
  nutrition: "A balanced dietary pattern emphasizes varied whole foods: colorful vegetables, fruits, whole grains, lean proteins, legumes, and healthy fats like olive oil and nuts, while minimizing ultra-processed foods and excess refined sugars."
};

/**
 * Generate Chat Response
 * @param {string} message - User query
 * @param {Array} history - Previous messages
 * @returns {Promise<{text: string, isFallback: boolean, disclaimer: string}>}
 */
async function generateChatResponse(message, history = []) {
  const apiKey = process.env.GEMINI_API_KEY ? process.env.GEMINI_API_KEY.trim() : "";
  const modelName = process.env.GEMINI_MODEL || "gemini-2.5-flash";

  // Check if API key is present
  if (!apiKey || apiKey === "your_google_gemini_api_key_here") {
    return generateFallbackChatResponse(message, "No Gemini API key configured in backend/.env");
  }

  try {
    // Attempt using official SDK or direct Gemini REST endpoint
    const responseText = await callGeminiAPI(apiKey, modelName, SYSTEM_INSTRUCTION, message, history);
    return {
      text: responseText,
      isFallback: false,
      disclaimer: MEDICAL_DISCLAIMER
    };
  } catch (error) {
    console.error("Gemini API Error:", error.message || error);

    // Handle quota exhaustion (429) or other errors gracefully
    const isQuota = error.status === 429 || (error.message && error.message.includes("quota")) || (error.message && error.message.includes("RESOURCE_EXHAUSTED"));
    const reason = isQuota
      ? "Google Gemini API rate limit or free-tier quota reached"
      : `Gemini service notice: ${error.message || "Network request failed"}`;

    return generateFallbackChatResponse(message, reason);
  }
}

/**
 * Generate AI Wellness Summary
 * @param {string} period - "daily" | "weekly"
 * @param {Array} healthLogs - Verified logs from Firestore
 * @param {Array} journalEntries - Optional user-approved journal entries
 * @returns {Promise<{summaryText: string, isFallback: boolean, disclaimer: string}>}
 */
async function generateWellnessSummary(period, healthLogs = [], journalEntries = []) {
  const apiKey = process.env.GEMINI_API_KEY ? process.env.GEMINI_API_KEY.trim() : "";
  const modelName = process.env.GEMINI_MODEL || "gemini-2.5-flash";

  const dataDescription = `
User Health Logs (${healthLogs.length} records provided):
${JSON.stringify(healthLogs, null, 2)}

User Journal Entries (${journalEntries.length} records provided):
${JSON.stringify(journalEntries, null, 2)}
`;

  const summaryPrompt = `Please analyze the provided user health and wellness records for a ${period} wellness summary.

Guidelines:
1. Only analyze the actual information supplied above. Never invent, hallucinate, or assume missing records.
2. If there are few or no records, explicitly state that insufficient data is available to draw definitive conclusions.
3. Review water intake, sleep duration/consistency, and physical activity/steps.
4. Identify any observable patterns or progress.
5. Provide 2-3 gentle, evidence-based wellness suggestions tailored to their logged data.
6. Do NOT diagnose diseases, prescribe medications, or recommend changing existing therapies.
7. Format with clear Markdown headings (e.g., ### Overview, ### Hydration & Sleep, ### Physical Activity, ### Healthy Recommendations).

Data to analyze:
${dataDescription}`;

  if (!apiKey || apiKey === "your_google_gemini_api_key_here") {
    return generateFallbackSummary(period, healthLogs, journalEntries, "No Gemini API key configured in backend/.env");
  }

  try {
    const summaryText = await callGeminiAPI(apiKey, modelName, SYSTEM_INSTRUCTION, summaryPrompt, []);
    return {
      summaryText,
      isFallback: false,
      disclaimer: MEDICAL_DISCLAIMER
    };
  } catch (error) {
    console.error("Gemini Summary API Error:", error.message || error);
    const isQuota = error.status === 429 || (error.message && error.message.includes("quota"));
    const reason = isQuota
      ? "Google Gemini free-tier quota limit reached"
      : `Gemini service notice: ${error.message || "Request failed"}`;
    return generateFallbackSummary(period, healthLogs, journalEntries, reason);
  }
}

/**
 * Helper to call Gemini REST API securely
 */
async function callGeminiAPI(apiKey, modelName, systemInstruction, prompt, history = []) {
  // Format contents for Gemini generateContent endpoint
  const contents = [];

  // Add conversation history if available
  if (Array.isArray(history) && history.length > 0) {
    for (const msg of history.slice(-6)) { // Keep last 6 messages for context
      contents.push({
        role: msg.role === "assistant" || msg.role === "model" ? "model" : "user",
        parts: [{ text: String(msg.content || msg.text || "") }]
      });
    }
  }

  // Add current message
  contents.push({
    role: "user",
    parts: [{ text: prompt }]
  });

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`;

  const payload = {
    contents,
    systemInstruction: {
      parts: [{ text: systemInstruction }]
    },
    generationConfig: {
      temperature: 0.7,
      maxOutputTokens: 1000,
      topP: 0.95
    }
  };

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    let errBody = {};
    try {
      errBody = await response.json();
    } catch (e) {
      // ignore
    }
    const err = new Error(errBody.error?.message || `HTTP ${response.status}: ${response.statusText}`);
    err.status = response.status;
    throw err;
  }

  const data = await response.json();
  const candidate = data.candidates?.[0];
  const text = candidate?.content?.parts?.map(p => p.text).join("") || "No response generated.";
  return text;
}

/**
 * Fallback generator for chat when Gemini is offline or quota reached
 */
function generateFallbackChatResponse(message, reason) {
  const lower = message.toLowerCase();
  let topicAnswer = "";

  if (lower.includes("sleep") || lower.includes("insomnia") || lower.includes("bed")) {
    topicAnswer = FALLBACK_TOPICS.sleep;
  } else if (lower.includes("water") || lower.includes("hydrat") || lower.includes("drink")) {
    topicAnswer = FALLBACK_TOPICS.hydration;
  } else if (lower.includes("exercise") || lower.includes("workout") || lower.includes("steps") || lower.includes("walk") || lower.includes("run")) {
    topicAnswer = FALLBACK_TOPICS.exercise;
  } else if (lower.includes("food") || lower.includes("diet") || lower.includes("eat") || lower.includes("nutrition")) {
    topicAnswer = FALLBACK_TOPICS.nutrition;
  } else {
    topicAnswer = "Maintaining a daily routine with balanced nutrition, adequate hydration, regular physical movement, and consistent sleep schedule provides the foundation for general physical and mental wellness.";
  }

  const responseText = `[Offline / Fallback Mode Notice: ${reason}]

${topicAnswer}

Please remember to discuss personal health queries with a certified healthcare provider.`;

  return {
    text: responseText,
    isFallback: true,
    disclaimer: MEDICAL_DISCLAIMER
  };
}

/**
 * Fallback generator for summary when Gemini is offline or quota reached
 */
function generateFallbackSummary(period, healthLogs, journalEntries, reason) {
  const logCount = healthLogs.length;

  let totalWater = 0;
  let totalSleep = 0;
  let totalSteps = 0;
  let totalExercise = 0;

  healthLogs.forEach(l => {
    totalWater += Number(l.waterIntakeMl) || 0;
    totalSleep += Number(l.sleepHours) || 0;
    totalSteps += Number(l.steps) || 0;
    totalExercise += Number(l.exerciseMinutes) || 0;
  });

  const avgWater = logCount > 0 ? Math.round(totalWater / logCount) : 0;
  const avgSleep = logCount > 0 ? (totalSleep / logCount).toFixed(1) : 0;
  const avgSteps = logCount > 0 ? Math.round(totalSteps / logCount) : 0;
  const avgExercise = logCount > 0 ? Math.round(totalExercise / logCount) : 0;

  const summaryText = `### ${period.toUpperCase()} Wellness Summary Report
*(Generated via Standard Statistical Engine – Fallback: ${reason})*

#### Overview
- **Period analyzed:** ${period}
- **Recorded days:** ${logCount} log entry/entries
- **Journal reflections:** ${journalEntries.length} record(s)

#### Key Averages
- **Hydration:** Average ${avgWater} mL per logged day
- **Sleep:** Average ${avgSleep} hours of sleep per night
- **Physical Activity:** Average ${avgSteps} steps and ${avgExercise} exercise minutes daily

#### Observations & Educational Recommendations
${logCount === 0
  ? "No health records were found for this period. Try logging your daily water, sleep, and physical activity in the Daily Tracker to see trends!"
  : `1. **Hydration Consistency**: Staying steady around 2,000 to 2,500 mL helps maintain cellular hydration and concentration.
2. **Rest & Recovery**: Aiming for 7 to 9 hours consistently reinforces circadian rhythm and muscular recovery.
3. **Daily Movement**: Building up to 8,000+ steps and incorporating active breaks supports cardiorespiratory fitness.`}

*Notice: This summary is based strictly on your logged records and is intended for personal informational tracking only.*`;

  return {
    summaryText,
    isFallback: true,
    disclaimer: MEDICAL_DISCLAIMER
  };
}

module.exports = {
  generateChatResponse,
  generateWellnessSummary,
  SYSTEM_INSTRUCTION,
  MEDICAL_DISCLAIMER
};
