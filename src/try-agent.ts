import {runAgent} from './agent.js';

async function main() {
  const response = await runAgent("Search for flights from NYC to LA");
  console.log(response);
}

await main();