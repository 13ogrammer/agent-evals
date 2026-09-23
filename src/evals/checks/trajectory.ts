import { judgeSemanticMatch } from "./judge.js";

export interface ActualToolCallForCheck {
  name: string;
  args: Record<string, any>;
  result: string;
}

export interface ArgCheck {
  tool: string;
  args?: Record<string, string>;
  validate?: (
    call: ActualToolCallForCheck,
    allCalls: ActualToolCallForCheck[],
  ) => string | null;
}

export interface TrajectoryExpectation {
  expectedTools: string[];
  requiredOrder?: [string, string][]; // [mustComeBefore, mustComeAfter] pairs
  allowedDuplicates?: boolean;
  argChecks?: ArgCheck[];
}

export interface ActualToolCall {
  name: string;
  args: Record<string, any>;
}

export interface TrajectoryResult {
  pass: boolean;
  reasons: string[];
}

function checkToolSetMatch(actualNames: string[], expectedTools: string[]): string[] {
  const reasons: string[] = [];
  const actualSet = new Set(actualNames);
  const expectedSet = new Set(expectedTools);

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

  return reasons;
}

function checkNoDuplicates(actualNames: string[]): string[] {
  const reasons: string[] = [];
  const seen = new Set<string>();
  for (const name of actualNames) {
    if (seen.has(name)) {
      reasons.push(`Tool "${name}" was called more than once (redundant)`);
    } else {
      seen.add(name);
    }
  }
  return reasons;
}

function checkRequiredOrder(actualNames: string[], requiredOrder: [string, string][]): string[] {
  const reasons: string[] = [];
  for (const [before, after] of requiredOrder ?? []) {
    const beforeIdx = actualNames.indexOf(before);
    const afterIdx = actualNames.indexOf(after);

    if (beforeIdx === -1 || afterIdx === -1) continue

    if (beforeIdx > afterIdx) {
      reasons.push(`Expected "${before}" before "${after}", but order was reversed`);
    }
  }

  return reasons;
}

async function checkSingleArg(
  check: ArgCheck,
  call: ActualToolCallForCheck,
  allCalls: ActualToolCallForCheck[],
): Promise<string[]> {
  const reasons: string[] = [];

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
    const error = check.validate(call, allCalls)
    if (error) reasons.push(error)
  }

  return reasons;
}

export async function checkAllArgs(
  argChecks: ArgCheck[],
  actual: ActualToolCallForCheck[],
): Promise<string[]> {
  const reasons: string[] = [];

  for (const check of argChecks) {
    const call = actual.find(c => c.name === check.tool);
    if (!call) continue;
    
    const checkReasons = await checkSingleArg(check, call, actual);
    reasons.push(...checkReasons);
  }

  return reasons;
}

export async function checkTrajectory(
  actual: ActualToolCallForCheck[],
  expected: TrajectoryExpectation,
): Promise<TrajectoryResult> {
  const actualNames = actual.map((call) => call.name);

  const reasons = [
    ...checkToolSetMatch(actualNames, expected.expectedTools),
    ...(expected.allowedDuplicates ? [] : checkNoDuplicates(actualNames)),
    ...checkRequiredOrder(actualNames, expected.requiredOrder ?? []),
    ...await checkAllArgs(expected.argChecks ?? [], actual),
  ];

  return { pass: reasons.length === 0, reasons };
  
}
