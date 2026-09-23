import { runAgent } from "../../agent/agent.js";
import { testCases } from "../datasets/dev.js";
import { checkGroundedness } from "../checks/groundedness.js";
import { checkTrajectory } from "../checks/trajectory.js";
import { checkCompleteness } from "../checks/completeness.js";
import { judgeAnswerQuality } from "../checks/judge.js";

const RUNS_PER_CASE = 5;

interface CaseSummary {
  id: string;
  groundednessPassRate: number;
  trajectoryPassRate: number;
  completenessPassRate: number;
  qualityPassRate: number;
  overallPassRate: number;
  sampleFailureReasons: string[];
}

async function main() {
  const summaries: CaseSummary[] = [];

  for (const tc of testCases) {
    let groundedPasses = 0;
    let trajectoryPasses = 0;
    let completenessPasses = 0;
    let overallPasses = 0;
    let qualityPasses = 0;

    const sampleFailureReasons: string[] = [];

    console.log(`\nRunning "${tc.id}" x${RUNS_PER_CASE}...`);

    for (let i = 0; i < RUNS_PER_CASE; i++) {
      const result = await runAgent(tc.input);
      const toolResultTexts = result.toolCalls.map((t) => t.result);

      const groundCheck = checkGroundedness(
        result.finalAnswer,
        toolResultTexts,
      );
      const trajCheck = await checkTrajectory(
        result.toolCalls,
        tc.expectedTrajectory,
      );
      const completenessCheck = checkCompleteness(
        result.finalAnswer,
        tc.requiredAnswerContains,
      );
      const qualityCheck = await judgeAnswerQuality(
        tc.input,
        result.finalAnswer
      );

      if (groundCheck.pass) groundedPasses++;
      if (trajCheck.pass) trajectoryPasses++;
      if (completenessCheck.pass) completenessPasses++;
      if (qualityCheck.pass) qualityPasses++;
      if (groundCheck.pass && trajCheck.pass && completenessCheck.pass && qualityCheck.pass) overallPasses++;

      const runReasons = [
        ...(groundCheck.pass
          ? []
          : [`groundedness: invented ${groundCheck.invented.join(", ")}`]),
        ...(trajCheck.pass
          ? []
          : trajCheck.reasons.map((r) => `trajectory: ${r}`)),
        ...(completenessCheck.pass
          ? []
          : [`completeness: missing ${completenessCheck.missing.join(", ")}`]),
        ...(qualityCheck.pass
          ? []
          : [`quality: ${qualityCheck.reasoning}`]),
      ];

      if (runReasons.length > 0 && sampleFailureReasons.length < 3) {
        sampleFailureReasons.push(`run ${i + 1}: ${runReasons.join(" | ")}`);
      }

      process.stdout.write(groundCheck.pass && trajCheck.pass && completenessCheck.pass && qualityCheck.pass ? "." : "x");
    }
    console.log("");

    summaries.push({
      id: tc.id,
      groundednessPassRate: (groundedPasses / RUNS_PER_CASE) * 100,
      trajectoryPassRate: (trajectoryPasses / RUNS_PER_CASE) * 100,
      completenessPassRate: (completenessPasses / RUNS_PER_CASE) * 100,
      qualityPassRate: (qualityPasses / RUNS_PER_CASE) * 100,
      overallPassRate: (overallPasses / RUNS_PER_CASE) * 100,
      sampleFailureReasons,
    });
  }

  console.log('\n=== Eval Report ===');
  for (const s of summaries) {
    console.log(`\n${s.id}`);
    console.log(`  Groundedness: ${s.groundednessPassRate.toFixed(0)}%`);
    console.log(`  Trajectory:   ${s.trajectoryPassRate.toFixed(0)}%`);
    console.log(`  Completeness: ${s.completenessPassRate.toFixed(0)}%`);
    console.log(`  Quality: ${s.qualityPassRate.toFixed(0)}%`);
    console.log(`  Overall:      ${s.overallPassRate.toFixed(0)}%`);
    if (s.sampleFailureReasons.length > 0) {
      console.log(`  Sample failures:`);
      s.sampleFailureReasons.forEach(r => console.log(`    - ${r}`));
    }
  }

  const avgOverall =
    summaries.reduce((sum, s) => sum + s.overallPassRate, 0) / summaries.length;
  console.log(`\nAverage overall pass rate: ${avgOverall.toFixed(1)}%`);
}

await main();
