import {runAgent} from '../agent.js';
import {checkGroundedness} from './groundedness.js';

async function main() {
  const userMessage = 'I want to fly from NYC to LA, what are my options?'
  const result = await runAgent(userMessage);

  const toolResultTexts = result.toolCalls.map(call => call.result);
  const groundedness = checkGroundedness(result.finalAnswer, toolResultTexts);

  console.log('--- Eval: Groundedness ---')
  console.log(`Pass: ${groundedness.pass}`);
  console.log(`Grounded flight numbers: ${groundedness.grounded.join(', ')}`);
  console.log(`Invented flight numbers: ${groundedness.invented.join(', ')}`);
}

await main();