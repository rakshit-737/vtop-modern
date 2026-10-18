/**
 * Test Suite: Attendance Math & Edge Cases
 */

function calculateAttendance(attended, conducted) {
  if (conducted === 0 || isNaN(attended) || isNaN(conducted)) {
    return { status: 'NO_DATA', percent: 0, bunks: 0, recovery: 0 };
  }

  // Exact percentage with 2 decimal places
  const percent = Number(((attended / conducted) * 100).toFixed(2));

  // Minimum required: 75%
  // Formula for bunks: floor((4A - 3C) / 3)
  // We want A / (C + b) >= 0.75  =>  b <= (4A - 3C) / 3
  let bunks = 0;
  if (4 * attended >= 3 * conducted) {
    bunks = Math.floor((4 * attended - 3 * conducted) / 3);
  }

  // Formula for recovery: max(0, 3C - 4A)
  // We want (A + r) / (C + r) >= 0.75  =>  r >= 3C - 4A
  let recovery = 0;
  if (percent < 75) {
    recovery = Math.max(0, 3 * conducted - 4 * attended);
  }

  let status = 'SAFE';
  if (percent < 75) {
    status = 'CRITICAL';
  } else if (bunks === 0) {
    status = 'ON_EDGE';
  } else if (percent < 80) {
    status = 'CAUTION';
  }

  return { percent, bunks, recovery, status };
}

// Verification Tests
const tests = [
  // Case 1: 100% attendance (15/15)
  { attended: 15, conducted: 15, expectedBunks: 5, expectedRecovery: 0, expectedStatus: 'SAFE' },
  // Verification: 15 / (15 + 5) = 15/20 = 75% exactly!

  // Case 2: 14/15 (93.33%)
  { attended: 14, conducted: 15, expectedBunks: 3, expectedRecovery: 0, expectedStatus: 'SAFE' },
  // Verification: 14 / (15 + 3) = 14/18 = 77.78% >= 75%. If 4 bunks: 14/19 = 73.68% < 75%. Exactly 3!

  // Case 3: Exactly 75% (15/20)
  { attended: 15, conducted: 20, expectedBunks: 0, expectedRecovery: 0, expectedStatus: 'ON_EDGE' },
  // Verification: If bunk 1: 15/21 = 71.4% < 75%. Exactly 0 bunks!

  // Case 4: Below 75% (10/15 = 66.67%)
  { attended: 10, conducted: 15, expectedBunks: 0, expectedRecovery: 5, expectedStatus: 'CRITICAL' },
  // Verification: Attend 5 classes: 15/20 = 75%. If 4: 14/19 = 73.68%. Exactly 5!

  // Case 5: 0/2 (0%)
  { attended: 0, conducted: 2, expectedBunks: 0, expectedRecovery: 6, expectedStatus: 'CRITICAL' },
  // Verification: Attend 6: 6/8 = 75%. Exactly 6!

  // Case 6: 0 conducted (no classes yet)
  { attended: 0, conducted: 0, expectedBunks: 0, expectedRecovery: 0, expectedStatus: 'NO_DATA' },

  // Case 7: 35/40 (87.5%)
  { attended: 35, conducted: 40, expectedBunks: 6, expectedRecovery: 0, expectedStatus: 'SAFE' },
  // Verification: 4(35) - 3(40) = 140 - 120 = 20. 20/3 = 6.666 => 6 bunks.
  // Check 6 bunks: 35/46 = 76.08%. Check 7 bunks: 35/47 = 74.46% (falls below). Exactly 6!

  // Case 8: 1/1 (100% single class)
  { attended: 1, conducted: 1, expectedBunks: 0, expectedRecovery: 0, expectedStatus: 'ON_EDGE' }
  // Verification: 4(1) - 3(1) = 1. 1/3 = 0 bunks. Bunk 1 => 1/2 = 50% < 75%. Exactly 0!
];

let failed = 0;
tests.forEach((t, i) => {
  const res = calculateAttendance(t.attended, t.conducted);
  const pass = res.bunks === t.expectedBunks && res.recovery === t.expectedRecovery && res.status === t.expectedStatus;
  if (!pass) {
    console.error(`❌ Test ${i + 1} Failed:`, { input: t, output: res });
    failed++;
  } else {
    console.log(`✅ Test ${i + 1} Passed: ${t.attended}/${t.conducted} -> ${res.percent}% | bunks: ${res.bunks} | recovery: ${res.recovery} | status: ${res.status}`);
  }
});

if (failed === 0) {
  console.log("\n🎉 ALL ATTENDANCE CALCULATION TESTS PASSED MATHEMATICALLY!\n");
  process.exit(0);
} else {
  process.exit(1);
}
