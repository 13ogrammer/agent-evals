import ollama from 'ollama';

const MODEL = 'llama3.2';


function searchFlights(origin: string, destination: string) {
  const fakeRoutes: Record<string, string> = {
    'nyc-la': 'Delta DL123, 6h flight, $320, departs 8:00 AM',
    'nyc-paris': 'Air France AF456, 7h flight, $610, departs 9:30 PM',
    'la-tokyo': 'ANA NH789, 11h flight, $890, departs 1:00 PM',
  };

  const key = `${origin.toLowerCase()}-${destination.toLowerCase()}`;
  return fakeRoutes[key] || 'No direct flights found for this route';
}

const tools = [
  {
    type: 'function' as const,
    function: {
      name: "search_flights",
      description: "Search for available flights between two cities",
      parameters: {
        type: 'object', 
        properties: {
          origin: { type: 'string', description: 'Departure city, e.g. NYC'},
          destination: { type: 'string', description: 'Arrival city, e.g. LA'}
        },
        required: ['origin', 'destination']
      }
    }
  }
]

export async function runAgent(userMessage: string) {
  const messages: any[] = [{role: 'user', content: userMessage}];

  const first = await ollama.chat({
    model: MODEL,
    messages: messages,
    tools: tools,
  })

  const toolCalls = first.message.tool_calls

  if(!toolCalls || toolCalls.length === 0) {
    return { finalAnswer: first.message.content, toolCalls: []}
  }

  messages.push(first.message);
  const executedCalls = []

  for (const call of toolCalls) {
    const {origin, destination} = call.function.arguments;
    const result = searchFlights(origin, destination)
    executedCalls.push({ 
      name: call.function.name, 
      args: call.function.arguments, 
      result: result
    });

    messages.push({
      role: 'tool',
      content: result,
    });
  }

  const second = await ollama.chat({
    model: MODEL,
    messages: [
      {
        role: 'system',
        content: 'You must ONLY mention flights, prices, and times that appear explicitly in the tool results above. Do NOT invent additional flights, airlines, prices, or times under any circumstances. If only one flight was returned, present only that one flight.'
      },
      ...messages
    ]
  })

  return { finalAnswer: second.message.content, toolCalls: executedCalls };
}

