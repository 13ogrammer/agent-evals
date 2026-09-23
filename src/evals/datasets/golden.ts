import type { TestCase } from './types.js';

export const goldenTestCases: TestCase[] = [
  // --- Regression coverage: same scenario types as dev, different route ---
  {
    id: 'golden-simple-search',
    input: 'Find me a flight from LA to Tokyo.',
    expectedTrajectory: {
      expectedTools: ['search_flights'],
      argChecks: [{ tool: 'search_flights', args: { origin: 'LA', destination: 'Tokyo' } }],
    },
    requiredAnswerContains: ['NH789', '890'],
  },
  {
    id: 'golden-currency-chain',
    input: 'What is the flight from NYC to LA, and how much is that in GBP?',
    expectedTrajectory: {
      expectedTools: ['search_flights', 'convert_currency'],
      requiredOrder: [['search_flights', 'convert_currency']],
      argChecks: [
        { tool: 'search_flights', args: { origin: 'NYC', destination: 'LA' } },
        {
          tool: 'convert_currency',
          args: { toCurrency: 'GBP' },
          validate: (call, allCalls) => {
            const searchCall = allCalls.find(c => c.name === 'search_flights');
            if (!searchCall) return null;
            try {
              const parsed = JSON.parse(searchCall.result);
              if (call.args.amount !== parsed.priceUSD) {
                return `convert_currency amount was ${call.args.amount}, expected ${parsed.priceUSD}`;
              }
            } catch { /* ignore parse errors here, already caught elsewhere */ }
            return null;
          },
        },
      ],
    },
    requiredAnswerContains: ['DL123', 'GBP'],
  },

  // --- Edge case: ambiguous/informal city naming ---
  {
    id: 'golden-informal-city-name',
    input: 'Any flights from the Big Apple to LA?',
    expectedTrajectory: {
      expectedTools: ['search_flights'],
      argChecks: [{ tool: 'search_flights', args: { origin: 'New York', destination: 'LA' } }],
    },
    requiredAnswerContains: ['DL123'],
  },

  // --- Edge case: off-topic / out-of-scope request ---
  {
    id: 'golden-off-topic',
    input: 'What is the capital of France?',
    expectedTrajectory: {
      expectedTools: [], // should NOT call any travel tool for this
    },
    requiredAnswerContains: ['Paris'],
  },

  // --- Edge case: no-result route, same class as dev but new cities ---
  {
    id: 'golden-no-route-new',
    input: 'Do you have flights from Seattle to Denver?',
    expectedTrajectory: {
      expectedTools: ['search_flights'],
      argChecks: [{ tool: 'search_flights', args: { origin: 'Seattle', destination: 'Denver' } }],
    },
    requiredAnswerContains: [
      ['no direct', 'not found', 'no flights', "unable to find", "couldn't find", 'no available'],
    ],
  },

  // --- Edge case: all three tools, different order emphasis than dev's version ---
  {
    id: 'golden-visa-first-emphasis',
    input: 'As an Indian citizen, do I need a visa for Tokyo? Also show me flights from LA and the price in JPY.',
    expectedTrajectory: {
      expectedTools: ['check_visa_requirement', 'search_flights', 'convert_currency'],
      requiredOrder: [['search_flights', 'convert_currency']],
    },
    requiredAnswerContains: ['visa', 'JPY'],
  },

  // --- Edge case: irrelevant/unsupported request the agent must decline gracefully ---
  {
    id: 'golden-unsupported-request',
    input: 'Can you book this flight for me and charge my credit card?',
    expectedTrajectory: {
      expectedTools: [], // no tool exists for booking; should not hallucinate one
    },
    requiredAnswerContains: [
      ['cannot', "can't", 'unable', 'not able', "don't have", 'no booking'],
    ],
  },
];