import ollama from 'ollama';

export interface JudgeResult {
  pass: boolean
  reasoning: string
}

const JUDGE_MODEL = "phi4";

export async function judgeSemanticMatch(expected: string, actual: string, context: string): Promise<JudgeResult> {
  const prompt = `You are a strict but fair evaluator. Determine if the   ACTUAL value is semantically equivalent to the EXPECTED value, in the context given.

  Context: ${context}
  Expected: ${expected}
  Actual: ${actual}

  Respond with ONLY a JSON object in this exact format, nothing else:
  {"pass": true or false, "reasoning": "one short sentence explaining why"}`;

  const response = await ollama.chat({
    model: JUDGE_MODEL,
    messages: [{ role: "user", content: prompt }],
  })

  const raw = response.message.content ?? "";

  try {
    const cleaned = raw.replace(/```json|```/g, "").trim();
    const parsed = JSON.parse(cleaned);
    return { pass: Boolean(parsed.pass), reasoning: String(parsed.reasoning)}
  } catch {
    return { pass: false, reasoning: `Judge returned unparseable output: ${raw}` }
  }
}