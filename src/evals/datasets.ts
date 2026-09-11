export interface ActualToolCallForCheck {
  name: string;
  args: Record<string, any>;
  result: string;
}

export interface ArgCheck {
  tool: string;
  args?: Record<string, string>;
  validate?: (
    call: ActualToolCallForCheck,
    allCalls: ActualToolCallForCheck[],
  ) => string | null;
}

export interface TrajectoryExpectation {
  expectedTools: string[];
  requiredOrder?: [string, string][]; // [mustComeBefore, mustComeAfter] pairs
  allowedDuplicates?: boolean;
  argChecks?: ArgCheck[];
}

export interface TestCase {
  id: string;
  input: string;
  expectedTrajectory: TrajectoryExpectation;
}

export const testCases: TestCase[] = [
  {
    id: "nyc-la-simple",
    input: "I want to fly from NYC to LA, what are my options?",
    expectedTrajectory: {
      expectedTools: ["search_flights"],
      argChecks: [
        { tool: "search_flights", args: { origin: "NYC", destination: "LA" } },
      ],
    },
  },
  {
    id: "nyc-paris-currency",
    input:
      "What is the flight from NYC to Paris, and what would the price be in EUR?",
    expectedTrajectory: {
      expectedTools: ["search_flights", "convert_currency"],
      requiredOrder: [["search_flights", "convert_currency"]], // must search before converting its price
      argChecks: [
        {
          tool: "search_flights",
          args: { origin: "NYC", destination: "Paris" },
        },
        {
          tool: "convert_currency",
          args: { toCurrency: "EUR" },
          // derived check: the amount converted must match the price found in search_flights' result
          validate: (call, allCalls) => {
            const searchCall = allCalls.find(
              (c) => c.name === "search_flights",
            );
            if (!searchCall) return null; // already flagged as missing elsewhere

            let expectedAmount:number;
            try {
              const parsed = JSON.parse(searchCall.result);
              expectedAmount = parsed.priceUSD;
            } catch {
              return `Could not parse search_flights result as JSON: ${searchCall.result}`;
            }

            if (typeof expectedAmount !== "number") return null

            if (call.args.amount !== expectedAmount) {
              return `convert_currency amount was ${call.args.amount}, expected ${expectedAmount} (from search_flights priceUSD)`;
            }
            
            return null;
          },
        },
      ],
    },
  },
  {
    id: "visa-and-flight",
    input:
      "I am a US citizen. Can I fly from NYC to Paris, and do I need a visa?",
    expectedTrajectory: {
      expectedTools: ["search_flights", "check_visa_requirement"],
      // no requiredOrder: these two are independent, either order is fine
    },
  },
  {
    id: "all-three-chained",
    input:
      "I am a US citizen flying from NYC to Paris. Check if I need a visa, find me a flight, " +
      "and tell me the price in EUR.",
    expectedTrajectory: {
      expectedTools: [
        "search_flights",
        "check_visa_requirement",
        "convert_currency",
      ],
      requiredOrder: [["search_flights", "convert_currency"]],
    },
  },
];
