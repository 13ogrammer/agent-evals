import ollama from "ollama";
import { tools, toolFunctions } from "./tools.js";

const MODEL = "llama3.2";
const SYSTEM_PROMPT =
  "You are a travel assistant. You must ONLY mention flights, prices, times, currency conversions, and visa information that appear explicitly in tool results. Do NOT invent additional flights, airlines, prices, or other details under any circumstances. Always state the specific facts returned by the tools (e.g. flight numbers, prices, times) in your final answer — do not reply with only a generic disclaimer. You may call multiple tools in sequence if the user's request requires it (e.g. search flights before converting the price).";

export interface ExecutedToolCall {
  name: string;
  args: Record<string, any>;
  result: string;
}

export async function runAgent(userMessage: string, maxRounds = 5) {
  const messages: any[] = [
    { role: "system", content: SYSTEM_PROMPT },
    { role: "user", content: userMessage },
  ];
  const executedCalls: ExecutedToolCall[] = [];

  for (let round = 0; round < maxRounds; round++) {
    const response = await ollama.chat({
      model: MODEL,
      messages,
      tools,
    });

    const toolCalls = response.message.tool_calls;

    if (!toolCalls || toolCalls.length === 0) {
      return {
        finalAnswer: response.message.content,
        toolCalls: executedCalls,
      };
    }

    messages.push(response.message);

    for (const call of toolCalls) {
      const fn = toolFunctions[call.function.name]!;
      const result = fn(call.function.arguments);

      executedCalls.push({
        name: call.function.name,
        args: call.function.arguments,
        result: result,
      });

      messages.push({
        role: "tool",
        content: result,
      });
    }
  }

  return {
    finalAnswer:
      "Could not complete the request within the allowed number of tool calls.",
    toolCalls: executedCalls,
  };
}
