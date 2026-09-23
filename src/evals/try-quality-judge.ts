import { judgeAnswerQuality } from "./judge.js";

async function main() {
  const goodAnswer = await judgeAnswerQuality(
    "I want to fly from NYC to LA, what are my options?",
    "Delta DL123, 6h flight, $320, departs 8:00AM"
  );
  console.log('Known-good case:', goodAnswer);

  const badAnswer = await judgeAnswerQuality(
    "I want to fly from NYC to LA, what are my options?",
    'Please note that the flight schedule and prices may vary depending on the time of booking and availability. The information provided above is based on the current data available and may change.'
  );
  console.log('Known-bad case:', badAnswer);
}

await main();