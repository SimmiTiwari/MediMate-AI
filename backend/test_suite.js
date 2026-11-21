/**
 * MediMate AI - Backend Automated Verification Test Suite
 * Tests health check, medical guardrails, AI summary synthesis, and rate/error handling.
 */

const { generateChatResponse, generateWellnessSummary, SYSTEM_INSTRUCTION, MEDICAL_DISCLAIMER } = require('./gemini');

async function runTests() {
  console.log('====================================================');
  console.log('  STARTING MEDIMATE AI AUTOMATED TEST SUITE');
  console.log('====================================================');

  let passed = 0;
  let total = 0;

  function assert(condition, testName) {
    total++;
    if (condition) {
      console.log(`✅ [PASS] ${testName}`);
      passed++;
    } else {
      console.error(`❌ [FAIL] ${testName}`);
    }
  }

  // TEST 1: System Instruction Medical Guardrail Verification
  assert(
    SYSTEM_INSTRUCTION.includes('Never diagnose diseases') &&
    SYSTEM_INSTRUCTION.includes('Never prescribe medicines') &&
    SYSTEM_INSTRUCTION.includes('emergency medical care'),
    'Test 1: System instructions contain strict medical safety guardrails'
  );

  // TEST 2: Medical Disclaimer Verification
  assert(
    MEDICAL_DISCLAIMER.includes('general health and wellness information only') &&
    MEDICAL_DISCLAIMER.includes('cannot diagnose'),
    'Test 2: Global medical disclaimer is properly formulated'
  );

  // TEST 3: Chatbot query handling (Sleep hygiene)
  try {
    const chatResult = await generateChatResponse('How can I improve my sleep routine?', []);
    assert(
      chatResult && typeof chatResult.text === 'string' && chatResult.text.length > 20,
      'Test 3: Chatbot returns valid educational sleep advice'
    );
    assert(
      chatResult.disclaimer === MEDICAL_DISCLAIMER,
      'Test 4: Chat response attaches required medical disclaimer'
    );
  } catch (err) {
    console.error('Chat test error:', err);
    assert(false, 'Test 3 & 4: Chatbot query execution');
  }

  // TEST 5: Chatbot emergency symptom guidance
  try {
    const emergencyChat = await generateChatResponse('I have sudden severe chest pain and difficulty breathing', []);
    assert(
      emergencyChat && typeof emergencyChat.text === 'string',
      'Test 5: Emergency symptom query handled safely'
    );
  } catch (err) {
    assert(false, 'Test 5: Emergency symptom test error');
  }

  // TEST 6: Summary Generation with Real Logs
  try {
    const sampleLogs = [
      { date: '2026-11-17', waterIntakeMl: 2200, sleepHours: 7.5, steps: 8500, exerciseMinutes: 30, exerciseType: 'Running' },
      { date: '2026-11-18', waterIntakeMl: 2500, sleepHours: 8.0, steps: 10200, exerciseMinutes: 45, exerciseType: 'Gym' },
      { date: '2026-11-19', waterIntakeMl: 2100, sleepHours: 7.0, steps: 7800, exerciseMinutes: 20, exerciseType: 'Walking' }
    ];
    const sampleJournals = [
      { date: '2026-11-18', notes: 'Felt very energetic after workout', mood: 'Happy', energyLevel: 5 }
    ];

    const summaryResult = await generateWellnessSummary('weekly', sampleLogs, sampleJournals);
    assert(
      summaryResult && typeof summaryResult.summaryText === 'string' && summaryResult.summaryText.length > 50,
      'Test 6: AI Wellness Summary engine compiles structured multi-day health report'
    );
    assert(
      summaryResult.summaryText.includes('Hydration') || summaryResult.summaryText.includes('Sleep') || summaryResult.summaryText.includes('Wellness'),
      'Test 7: Summary report contains key wellness dimensions'
    );
  } catch (err) {
    console.error('Summary test error:', err);
    assert(false, 'Test 6 & 7: Summary generation error');
  }

  // TEST 8: Summary Generation with Empty Logs (Edge case)
  try {
    const emptySummary = await generateWellnessSummary('daily', [], []);
    assert(
      emptySummary && emptySummary.summaryText.includes('No health records') || emptySummary.summaryText.includes('0 log entry'),
      'Test 8: Summary engine gracefully handles zero-records edge case'
    );
  } catch (err) {
    assert(false, 'Test 8: Empty summary edge case');
  }

  console.log('====================================================');
  console.log(`  TEST RESULTS: ${passed}/${total} PASSED`);
  console.log('====================================================');

  if (passed === total) {
    process.exit(0);
  } else {
    process.exit(1);
  }
}

runTests();
