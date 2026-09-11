import { runAgent } from "../agent.js";
import { testCases } from "./datasets.js";
import { checkTrajectory } from "./trajectory.js";

async function main() {
  const tc = testCases.find(tc => tc.id === 'nyc-paris-currency')!;

  const result = await runAgent(tc.input);
  console.log(JSON.stringify(result, null, 2));
  const check = checkTrajectory(result.toolCalls, tc.expectedTrajectory);

  console.log('--- Eval: Trajectory ---');
  console.log('Tool calls made: ', result.toolCalls.map(call => call.name).join(', '));
  console.log('Pass:', check.pass);
  if (!check.pass) {
    console.log('Reasons:', check.reasons);
  }
}

await main();
