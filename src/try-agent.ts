import {runAgent} from './agent.js';

async function main() {
  const result = await runAgent('I want to fly from NYC to LA, what are my options?');
  console.log(JSON.stringify(result, null, 2));
}

await main();