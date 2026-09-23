import ollama from "ollama";

export interface JudgeResult {
  pass: boolean;
  reasoning: string;
}

export interface QualityJudgeResult {
  pass: boolean;
  helpful: boolean;
  clear: boolean;
  concise: boolean;
  reasoning: string;
}

const JUDGE_MODEL = "phi4";

export async function judgeSemanticMatch(
  expected: string,
  actual: string,
  context: string,
): Promise<JudgeResult> {
  const prompt = `You are a strict but fair evaluator. Determine if the   ACTUAL value is semantically equivalent to the EXPECTED value, in the context given.

  Context: ${context}
  Expected: ${expected}
  Actual: ${actual}

  Respond with ONLY a JSON object in this exact format, nothing else:
  {"pass": true or false, "reasoning": "one short sentence explaining why"}`;

  const response = await ollama.chat({
    model: JUDGE_MODEL,
    messages: [{ role: "user", content: prompt }],
  });

  const raw = response.message.content ?? "";

  try {
    const cleaned = raw.replace(/```json|```/g, "").trim();
    const parsed = JSON.parse(cleaned);
    return { pass: Boolean(parsed.pass), reasoning: String(parsed.reasoning) };
  } catch {
    return {
      pass: false,
      reasoning: `Judge returned unparseable output: ${raw}`,
    };
  }
}

/**
 * Judges the overall quality of an agent's final answer against the
 * user's original request. Complements groundedness/completeness by
 * checking subjective qualities those rule-based checks can't capture.
 */
export async function judgeAnswerQuality(
  userMessage: string,
  finalAnswer: string,
): Promise<QualityJudgeResult> {
  const prompt = `You are a strict evaluator of an AI travel assistant's response.

  IMPORTANT CONTEXT: This assistant's search tool only ever returns a single matching flight per route (it is a simple demo system, not a real multi-airline search engine). If the user asks for "options" but the answer correctly presents just the one flight that was found, that is CORRECT behavior, not a flaw — do not penalize for lacking alternatives the system was never able to provide.

  User asked: "${userMessage}"
  Assistant answered: "${finalAnswer}"

  Judge the answer on three criteria:
  1. HELPFUL: Does it directly address what the user asked, using specific details (not vague)?
  2. CLEAR: Is it easy to understand, well-organized, without confusing or contradictory statements?
  3. CONCISE: Does it avoid unnecessary padding, generic disclaimers, or irrelevant offers not asked for?

  Respond with ONLY a JSON object in this exact format, nothing else:
  {"helpful": true or false, "clear": true or false, "concise": true or false, "reasoning": "one short sentence summarizing the main issue, or why it's good"}`;

  const response = await ollama.chat({
    model: JUDGE_MODEL,
    messages: [{ role: "user", content: prompt }],
  });

  const raw = response.message.content ?? "";

  try {
    const cleaned = raw.replace(/```json|```/g, "").trim();
    const parsed = JSON.parse(cleaned);
    const helpful = Boolean(parsed.helpful);
    const clear = Boolean(parsed.clear);
    const concise = Boolean(parsed.concise);
    return {
      pass: helpful && clear && concise,
      helpful,
      clear,
      concise,
      reasoning: String(parsed.reasoning),
    };
  } catch {
    return {
      pass: false,
      helpful: false,
      clear: false,
      concise: false,
      reasoning: `Judge returned unparseable output: ${raw}`,
    };
  }
}
