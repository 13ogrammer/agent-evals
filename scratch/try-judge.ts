import { judgeSemanticMatch } from "../src/evals/checks/judge.js"

async function main() {
  const result = await judgeSemanticMatch(
    'NYC',
    'New York City',
    'Comparing a city name argument passed to a flight search tool'
  )
  console.log(result)

  const mismatch = await judgeSemanticMatch(
    'Paris',
    'London',
    'Comapriing a city name argument passed to a flight search tool'
  )
  console.log(mismatch) 
}

await main()