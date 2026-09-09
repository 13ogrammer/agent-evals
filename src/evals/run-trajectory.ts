import { runAgent } from "../agent.js";
import { testCases } from "./datasets.js";
import { checkTrajectory } from "./trajectory.js";

async function main() {
  const tc = testCases[0]!

  const result = await runAgent(tc.input);
  const check = checkTrajectory(result.toolCalls, tc.expectedToolCalls);

  console.log('--- Eval: Trajectory ---');
  console.log('Pass:', check.pass);
  if (!check.pass) {
    console.log('Reasons:', check.reasons);
  }
}

await main();
