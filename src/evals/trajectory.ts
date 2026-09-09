import type { ExpectedToolCall } from "./datasets.js";

export interface ActualToolCall {
  name: string;
  args: Record<string, any>;
}

export interface TrajectoryResult {
  pass: boolean;
  reasons: string[];
}

function argsMatch(
  actual: Record<string, any>,
  expected: Record<string, string>,
): boolean {
  return Object.entries(expected).every(([key, expectedVal]) => {
    const actualVal = actual[key];
    if (typeof actualVal !== "string") return false;

    return actualVal.toLowerCase() === expectedVal.toLowerCase();
  });
}

export function checkTrajectory(
  actual: ActualToolCall[],
  expected: ExpectedToolCall[],
): TrajectoryResult {
  const reasons: string[] = [];

  if (actual.length !== expected.length) {
    reasons.push(
      `Expected ${expected.length} tool calls, but got ${actual.length}`,
    );
    return { pass: false, reasons };
  }

  for (let i = 0; i < expected.length; i++) {
    const exp = expected[i]!;
    const act = actual[i]!;

    if (act.name !== exp.name) {
      reasons.push(
        `Step ${i}: expected tool "${exp.name}", but got "${act.name}"`,
      );
      continue;
    }

    if (!argsMatch(act.args, exp.args)) {
      reasons.push(
        `Step ${i}: args mismatch. Expected ${JSON.stringify(exp.args)}, but got ${JSON.stringify(act.args)}`,
      );
    }
  }

  return { pass: reasons.length === 0, reasons };
}
