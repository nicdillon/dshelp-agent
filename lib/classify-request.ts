import { ModelMessage, generateObject } from "ai";
import { createGateway } from "@ai-sdk/gateway";
import { z } from "zod";

// Initialize gateway - when deployed to Vercel, OIDC is used automatically
const gateway = createGateway(
  process.env.AI_GATEWAY_API_KEY
    ? { apiKey: process.env.AI_GATEWAY_API_KEY }
    : {}
);

export const classifyRequest = async (messages: ModelMessage[]) => {
  const { object } = await generateObject({
    model: gateway("openai/gpt-4o"),
    system: `You are a request classifier for the Vercel Developer Success (DS) team.

Your job is to determine if a request is within the DS team's scope of support.

## IN SCOPE - DS Team handles:
- **Technical troubleshooting**: Debugging issues, error messages, configuration problems with Vercel or Next.js
- **Best practices & architecture**: Guidance on how to build and structure applications using Vercel, Next.js, or AI SDK
- **Customer-specific issues**: Problems with Vercel platform, deployments, Next.js applications (NOT pricing or contracts)
- **AI SDK support**: Implementation help, questions about Vercel AI SDK features

## OUT OF SCOPE - Forward to other teams:
- **Billing/Pricing**: Questions about costs, pricing plans, invoices → Sales/Billing team
- **Contracts/Legal**: Contract terms, legal agreements → Legal/Contracts team
- **Sales inquiries**: Product demos, enterprise sales, feature requests → Sales team
- **General support**: Basic account issues, password resets → General Support
- **Non-Vercel topics**: General programming questions unrelated to Vercel/Next.js/AI SDK

Analyze the user's request and classify it.`,
    schema: z.object({
      isInScope: z.boolean().describe("True if the request is within DS team scope, false otherwise"),
      category: z.enum([
        "technical-troubleshooting",
        "best-practices",
        "customer-issue",
        "ai-sdk-support",
        "billing-pricing",
        "contracts-legal",
        "sales-inquiry",
        "general-support",
        "out-of-scope"
      ]).describe("The category that best matches the request"),
      reasoning: z.string().describe("Brief explanation of why this classification was chosen"),
      suggestedTeam: z.string().optional().describe("If out of scope, which team should handle this (e.g., 'Sales team', 'Billing team', 'General Support')"),
    }),
    messages,
  });

  return object;
};
