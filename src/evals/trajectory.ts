import type { ActualToolCallForCheck, TrajectoryExpectation } from "./datasets.js";
import { judgeSemanticMatch } from "./judge.js";

export interface ActualToolCall {
  name: string;
  args: Record<string, any>;
}

export interface TrajectoryResult {
  pass: boolean;
  reasons: string[];
}

export async function checkTrajectory(
  actual: ActualToolCallForCheck[],
  expected: TrajectoryExpectation,
): Promise<TrajectoryResult> {
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

    if (check.args) {
      for (const [key, expectedVal] of Object.entries(check.args)) {
        const actualVal = call.args[key];
        if (actualVal === undefined) {
          reasons.push(`"${check.tool}" missing arg "${key}"`)
          continue
        }
        const judged = await judgeSemanticMatch(
          expectedVal,
          String(actualVal),
          `Argument "${key}" passed to tool "${check.tool}"`
        )
        if (!judged.pass) {
          reasons.push(`"${check.tool}" arg "${key}": ${judged.reasoning}`)
        }
      }
    }

    if (check.validate) {
      const error = check.validate(call, actual)
      if (error) reasons.push(error)
    }
  }

  return { pass: reasons.length === 0, reasons };
}
