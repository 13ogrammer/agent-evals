# Agent Evals — Flight Search Agent

A hands-on project for learning how to evaluate AI agents: not just "does it sound right,"
but "did it use its tools correctly, and is its answer grounded in real data."

Built with **TypeScript** + **Ollama** (local, open-source LLM — no API keys, no cost).

## Stack

- **Runtime**: Node.js + [tsx](https://github.com/privatenumber/tsx) (run TS directly, no build step)
- **Model**: [Ollama](https://ollama.com) running `llama3.2` locally
- **Client**: [`ollama`](https://www.npmjs.com/package/ollama) npm package

## Prerequisites

1. Install Ollama: https://ollama.com/download
2. Pull the model:
   ```bash
   ollama pull llama3.2
   ```
3. Make sure the Ollama server is running:
   ```bash
   ollama serve
   ```

## Setup

```bash
npm install
```

## Project structure

```
src/
  agent.ts                     # The agent: decides when to call search_flights, forms an answer
  try-agent.ts                 # Manual one-off test of the agent
  evals/
    dataset.ts                 # Test cases: input + expected tool call
    groundedness.ts            # Checks the answer doesn't invent flights not in tool results
    trajectory.ts              # Checks the agent called the right tool with the right args
    run-groundedness.ts        # Runs groundedness check on a single case
    run-trajectory.ts          # Runs trajectory check on a single case
    run-suite.ts               # Full eval suite across all test cases (aggregate pass rate)
```

## The agent

A minimal flight-search assistant with one tool, `search_flights(origin, destination)`.
It looks up a (fake, hardcoded) flight database and answers the user's question.

Run it manually:
```bash
npx tsx src/try-agent.ts
```

## What is an "eval" here?

An eval = a **dataset** of test cases + a **grader** that scores the agent's behavior on each one,
producing an aggregate pass rate you can track over time as you change prompts/models.

We check two independent things:

| Eval | Question it answers | File |
|---|---|---|
| **Groundedness** | Did the agent's final answer only mention facts that actually came from the tool result (no hallucinated flights/prices)? | `evals/groundedness.ts` |
| **Trajectory** | Did the agent call the *right* tool, with the *right* arguments, in the *right* order? | `evals/trajectory.ts` |

## Running the evals

Full suite (all test cases, aggregate report):
```bash
npx tsx src/evals/run-suite.ts
```

Individual checks (useful while debugging one case):
```bash
npx tsx src/evals/run-groundedness.ts
npx tsx src/evals/run-trajectory.ts
```

## Key lesson learned

Our first agent version hallucinated extra flights/airlines that were never returned by the
tool — passing only 50% of the groundedness eval. Adding an explicit system prompt constraint
("only mention flights that appear in the tool results") fixed it to 100%, **proven by re-running
the same eval suite**, not just by eyeballing one response.

> Local LLMs are non-deterministic — for a production setup, run each case multiple times (e.g. 3–5x)
> and report a pass *rate* per case rather than a single pass/fail.

## Roadmap

- [x] Groundedness eval (fact-checking against tool output)
- [x] Trajectory eval (correct tool + correct arguments)
- [ ] Combined eval report (both checks in one suite run)
- [ ] LLM-as-judge eval (subjective quality: helpfulness, tone, clarity)
- [ ] Persist eval results over time for regression tracking