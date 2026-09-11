import { runAgent } from "../agent.js";
import { checkCompleteness } from "./completeness.js";
import { testCases } from "./datasets.js";

async function main() {
  const tc = testCases.find(tc => tc.id === 'visa-and-flight')!;

  const result = await runAgent(tc.input);
  const check = checkCompleteness(result.finalAnswer, tc.requiredAnswerContains)

  console.log('--- Eval: Completeness ---');
  console.log('Pass:', check.pass);
  if (!check.pass) {
    console.log('Missing:', check.missing.join(', '));
  }
}

await main();