import type { ActualToolCallForCheck, TrajectoryExpectation } from "./datasets.js";

export interface ActualToolCall {
  name: string;
  args: Record<string, any>;
}

export interface TrajectoryResult {
  pass: boolean;
  reasons: string[];
}

function staticArgsMatch(actual: Record<string, any>, expected: Record<string, any>): boolean {
  return Object.entries(expected).every(([key, expectedVal]) => {
    const actualVal = actual[key];
    if (actualVal === undefined) return false;

    return String(actualVal).toLowerCase() === String(expectedVal).toLowerCase();
  })
}

export function checkTrajectory(
  actual: ActualToolCallForCheck[],
  expected: TrajectoryExpectation,
): TrajectoryResult {
  const reasons: string[] = [];
  const actualNames = actual.map((call) => call.name);
  const actualSet = new Set(actualNames);
  const expectedSet = new Set(expected.expectedTools);

  // 1. Set match: nothing missing, nothing extra
  for (const tool of expectedSet) {
    if (!actualSet.has(tool)) {
      reasons.push(`Missing expected tool call: "${tool}"`);
    }
  }

  for (const tool of actualSet) {
    if (!expectedSet.has(tool)) {
      reasons.push(`Unexpected tool call: "${tool}"`);
    }
  }

  // 2. Duplicate check
  if (!expected.allowedDuplicates) {
    const seen = new Set<string>();
    for (const name of actualNames) {
      if (seen.has(name)) {
        reasons.push(`Tool "${name}" was called more than once (redundant)`);
      } else {
        seen.add(name);
      }
    }
  }

  // 3. Order constraints
  for (const [before, after] of expected.requiredOrder ?? []) {
    const beforeIdx = actualNames.indexOf(before);
    const afterIdx = actualNames.indexOf(after);

    if (beforeIdx === -1 || afterIdx === -1) continue

    if (beforeIdx > afterIdx) {
      reasons.push(`Expected "${before}" before "${after}", but order was reversed`);
    }
  }

  // 4. Static argument match
  for (const check of expected.argChecks ?? []) {
    const call = actual.find(c => c.name === check.tool);
    if (!call) continue

    if(check.args && !staticArgsMatch(call.args, check.args)) {
      reasons.push(`"${check.tool}" args mismatch. Expected ${JSON.stringify(check.args)}, got ${JSON.stringify(call.args)}`);
    }

    if (check.validate) {
      const error = check.validate(call, actual)
      if (error) reasons.push(error)
    }
  }

  return { pass: reasons.length === 0, reasons };
}
