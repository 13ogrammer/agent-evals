export interface TestCase {
  id: string
  input: string
}

export const testCases: TestCase[] = [
  { id: 'nyc-la', input: 'I want to fly from NYC to LA, what are my options?' },
  { id: 'nyc-paris', input: 'What flights go from NYC to Paris?' },
  { id: 'la-tokyo', input: 'Find me a flight from LA to Tokyo.' },
  { id: 'no-route', input: 'Any flights from Chicago to Miami?' },
];
