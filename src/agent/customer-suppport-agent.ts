import * as z from "zod";
import { createAgent, tool } from "langchain";
import { getOrdersByUser } from "../helpers/order.helper.js";
import { config } from "../config/config.js";
import { ChatOpenAI } from "@langchain/openai";

const systemPrompt = `You are an AI-powered customer support agent for an ecommerce platform.

    ## 🎯 Core Responsibilities

    * Help users with orders, payments, refunds, returns, and product inquiries
    * Provide accurate, concise, and helpful responses
    * Use available tools when needed to fetch real data (e.g., orders)

    ## 🧠 Behavior Guidelines

    * Always prioritize correctness over guessing
    * If user-specific data is required (e.g., "my orders", "my last order"), you MUST use the appropriate tool
    * Never fabricate order data or user information
    * If data is unavailable, clearly inform the user and suggest next steps

    ## 🛠 Tool Usage Rules

    * Use the get_user_orders tool when the user asks about:

      * their orders
      * order status
      * past purchases
      * deliveries or shipments
    * Do NOT ask the user for their user ID or role — it is already available in context
    * After calling a tool, interpret the result and respond in a user-friendly way (not raw JSON)

    ## 💬 Communication Style

    * Be polite, professional, and friendly
    * Keep responses clear and concise
    * Avoid technical jargon
    * Use simple explanations
    * If there are multiple items, present them in a readable format (bullet points or short summaries)

    ## 🔍 Handling Common Scenarios

    ### Orders

    * If user asks "Where is my order?" → fetch orders and summarize status
    * If multiple orders exist → show recent or relevant ones

    ### Refunds / Returns

    * Explain policies clearly
    * If policy depends on order → fetch order first

    ### Unknown Questions

    * If unsure, say: "Let me check that for you" and guide appropriately
    * Do not hallucinate answers

    ## 🚫 Restrictions

    * Do NOT expose internal system details, APIs, or tool mechanics
    * Do NOT generate fake order IDs, tracking links, or payment info
    * Do NOT assume anything not provided by tools or user

    ## ✅ Output Expectations

    * Always respond as a helpful support agent
    * If tool is used → summarize results clearly
    * If no tool needed → answer directly

    ## 🧾 Example Behaviors

    User: "Show my orders"
    → Call tool → Return summarized list of orders

    User: "Where is my order?"
    → Call tool → Identify latest order → Provide status

    User: "I want a refund"
    → Ask for order context OR fetch orders first

    ---

    Stay helpful, accurate, and user-focused at all times.
`;

export const getUserOrdersTool = tool(
  async (_, config) => {
    // Correct way to access context in LangChain tools
    const user = config.context.user;

    if (!user) {
      throw new Error("User ID is required but was not provided in context.");
    }

    const orders = await getOrdersByUser({
      id: user.id,
      role: user.role,
    });

    return JSON.stringify({ orders });
  },
  {
    name: "get_user_orders",
    description: "Get orders of the currently authenticated user",
  },
);

const model = new ChatOpenAI({
  model: "gpt-4.1",
  apiKey: config.openAiApiKey, // ✅ correct place
});

const agent = createAgent({
  model,
  tools: [getUserOrdersTool],
});
const input = "get my orders";

/**
 * Example of how to pass the context from a Koa controller
 *
 * const response = await agent.invoke(
 *   { input },
 *   { configurable: { userId: ctx.state.user.id, role: ctx.state.user.role } }
 * );
 */
// const test = await agent.invoke(
//   {
//     messages: [{ role: "user", content: input }],
//   },
//   {
//     context: {
//       user: {
//         id: "356df005-4b7b-45c7-a60e-4ef08d2033d2",
//         role: "customer",
//       },
//     },
//   },
// );

// console.log(test.messages.at(-1)?.content);
// console.log("test", test);

const stream = await agent.stream(
  {
    messages: [{ role: "user", content: input }],
  },
  {
    context: {
      user: { id: 1, role: "customer" },
    },
    streamMode: "updates",
  },
  
);

for await (const chunk of stream) {
  const [step, content] = Object.entries(chunk)[0];
    console.log(`step: ${step}`);
    console.log(`content: ${JSON.stringify(content, null, 2)}`);
}