import { testCases } from "./datasets.js"
import { runAgent } from "../agent.js";
import { checkGroundedness } from "./groundedness.js";

interface EvalRecord {
  id: string
  input: string
  finalAnswer: string
  pass: boolean
  invented: string[]
}

async function main() {
  const records: EvalRecord[] = [];

  for (const tc of testCases) {
    const result = await runAgent(tc.input);
    const toolResultTexts = result.toolCalls.map(tr => tr.result);
    const check = checkGroundedness(result.finalAnswer, toolResultTexts);

    records.push({
      id: tc.id,
      input: tc.input,
      finalAnswer: result.finalAnswer,
      pass: check.pass,
      invented: check.invented,
    });

    console.log(`[${check.pass ? "PASS" : "FAIL"}] ${tc.id}`)
    if (!check.pass) {
      console.log(`  Invented flights: ${check.invented.join(", ")}`);
    }
  }

  const passCount = records.filter(r => r.pass).length;
  const passRate = (passCount / records.length) * 100;
  
  console.log('\n--- Eval Report: Groundedness ---');
  console.log(`Passed: ${passCount} / ${records.length} (${passRate.toFixed(1)}%)`)
}

await main()