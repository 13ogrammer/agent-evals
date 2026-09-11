import {z} from 'zod';



export function searchFlights(origin: string, destination: string) {
  const fakeRoutes: Record<string, string> = {
    'nyc-la': 'Delta DL123, 6h flight, $320, departs 8:00 AM',
    'nyc-paris': 'Air France AF456, 7h flight, $610, departs 9:30 PM',
    'la-tokyo': 'ANA NH789, 11h flight, $890, departs 1:00 PM',
  };

  const key = `${origin.toLowerCase()}-${destination.toLowerCase()}`;
  return fakeRoutes[key] || 'No direct flights found for this route';
}

export function convertCurrency(amount: number, toCurrency: string): string {
  const rates: Record<string, number> = {
    'eur': 0.92,
    'jpy': 149.5,
    'gbp': 0.79
  }

  const rate = rates[toCurrency.toLowerCase()];
  if (!rate) return `Unknown currency: ${toCurrency}`;
  
  const converted = (amount * rate).toFixed(2);
  return `${amount}USD = ${converted} ${toCurrency.toUpperCase()}`;
}

export function checkVisaRequirement(nationality: string, destination: string): string {
  const visaFree: Record<string, string[]> = {
    'us': ['paris', 'tokyo', 'la'],
    'india': ['tokyo']
  };

  const nat = nationality.toLowerCase();
  const dest = destination.toLowerCase();

  const isFree = visaFree[nat]?.includes(dest);

  return isFree
    ? `No visa required for ${nationality} to travel to ${destination}`
    : `Visa required for ${nationality} to travel to ${destination}`;
}

export const tools = [
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
  },
  {
    type: 'function' as const,
    function: {
      name: "convert_currency",
      description: "Convert an amount from USD to another currency",
      parameters: {
        type: 'object', 
        properties: {
          amount: { type: 'number', description: 'Amount in USD'},
          toCurrency: { type: 'string', description: 'Target currency, e.g. EUR'}
        },
        required: ['amount', 'toCurrency']
      }
    }
  },
  {
    type: 'function' as const,
    function: {
      name: "check_visa_requirement",
      description: "Check if a visa is required for a nationality to travel to a destination",
      parameters: {
        type: 'object', 
        properties: {
          nationality: { type: 'string', description: 'Nationality of the traveler, e.g. US'},
          destination: { type: 'string', description: 'Destination country or city, e.g. Paris'}
        },
        required: ['nationality', 'destination']
      }
    }
  }
]

const searchFlightsSchema = z.object({
  origin: z.string().min(1),
  destination: z.string().min(1)
});

const convertCurrencySchema = z.object({
  amount: z.number().min(0),
  toCurrency: z.string().min(1)
});

const checkVisaRequirementSchema = z.object({
  nationality: z.string().min(1),
  destination: z.string().min(1)
});

function validateArgs<T>(schema: z.ZodType<T>, args: unknown, toolName: string): T | string {
  const result = schema.safeParse(args);
  if (!result.success) {
    const issues = result.error.issues.map(i => `${i.path.join('.')}: ${i.message}`).join('; ');
    return `Error: ${toolName} received invalid arguments (${issues})`;
  }
  return result.data;
}

export const toolFunctions: Record<string, (args: any) => string> = {
  search_flights: (args) => {
    const parsed = validateArgs(searchFlightsSchema, args, 'search_flights');
    if (typeof parsed === 'string') return parsed;

    return searchFlights(parsed.origin, parsed.destination);
  },

  convert_currency: (args) => {
    const parsed = validateArgs(convertCurrencySchema, args, 'convert_currency');
    if (typeof parsed === 'string') return parsed;

    return convertCurrency(parsed.amount, parsed.toCurrency);
  },

  check_visa_requirement: (args) => {
    const parsed = validateArgs(checkVisaRequirementSchema, args, 'check_visa_requirement');
    if (typeof parsed === 'string') return parsed;
    
    return checkVisaRequirement(parsed.nationality, parsed.destination);
  }
}
