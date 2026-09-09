function extractFlightNumbers(text: string): string[] {
  const matches = text.match(/\b[A-Z]{2,3}\d{2,4}\b/g);
  return matches ?? [];
}

export interface GroundednessResult {
  pass: boolean
  invented: string[]
  grounded: string[]
}

export function checkGroundedness(finalAnswer: string, toolResults: string[]): GroundednessResult {
  const answerFlights = extractFlightNumbers(finalAnswer);
  const sourceFlights = new Set(toolResults.flatMap(extractFlightNumbers));

  const invented = answerFlights.filter(flight => !sourceFlights.has(flight));
  const grounded = answerFlights.filter(flight => sourceFlights.has(flight));
  const pass = invented.length === 0;

  return { pass, invented, grounded };
}
