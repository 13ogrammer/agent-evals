export interface CompletenessResult {
  pass: boolean;
  missing: string[];
}

export function checkCompleteness(
  finalAnswer: string,
  requirements: (string | string[])[],
) {
  const lower = (finalAnswer ?? "").toLowerCase();
  const missing: string[] = [];

  for (const req of requirements) {
    const alternatives = Array.isArray(req) ? req : [req];
    const matched = alternatives.some((alt) =>
      lower.includes(alt.toLowerCase()),
    );

    if (!matched) {
      missing.push(alternatives.join(" OR "));
    }
  }

  return { pass: missing.length === 0, missing };
}
