export interface ExpectedToolCall {
  name: string;
  args: Record<string, string>;
}

export interface TestCase {
  id: string;
  input: string;
  expectedToolCalls: ExpectedToolCall[];
}

export const testCases: TestCase[] = [
  {
    id: "nyc-la",
    input: "I want to fly from NYC to LA, what are my options?",
    expectedToolCalls: [
      { name: "search_flights", args: { origin: "NYC", destination: "LA" } },
    ],
  },
  {
    id: "nyc-paris",
    input: "What flights go from NYC to Paris?",
    expectedToolCalls: [
      { name: "search_flights", args: { origin: "NYC", destination: "Paris" } },
    ],
  },
  {
    id: "la-tokyo",
    input: "Find me a flight from LA to Tokyo.",
    expectedToolCalls: [
      { name: "search_flights", args: { origin: "LA", destination: "Tokyo" } },
    ],
  },
  {
    id: "no-route",
    input: "Any flights from Chicago to Miami?",
    expectedToolCalls: [
      {
        name: "search_flights",
        args: { origin: "Chicago", destination: "Miami" },
      },
    ],
  },
];
