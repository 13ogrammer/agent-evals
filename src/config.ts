export const config = {
  agentModel: process.env.AGENT_MODEL ?? 'qwen2.5:7b',
  judgeModel: process.env.JUDGE_MODEL ?? 'phi4',
  runsPerCase: Number(process.env.RUNS_PER_CASE ?? 5),
  maxAgentRounds: Number(process.env.MAX_AGENT_ROUNDS ?? 5),
  passRateThreshold: Number(process.env.PASS_RATE_THRESHOLD ?? 85), // used later for CI gating
};