import { ModelMessage, generateText, tool } from "ai";
import { createGateway } from "@ai-sdk/gateway";
import { z } from "zod";
import { postTicketCreationMessage } from "./create-ticket-message";

// Initialize gateway - when deployed to Vercel, OIDC is used automatically
// IMPORTANT: Don't pass apiKey property at all to enable OIDC on Vercel
// If an API key is present, it will always be used instead of OIDC
const gatewayApiKey = process.env.AI_GATEWAY_API_KEY?.trim();
const gateway = createGateway(
  gatewayApiKey && gatewayApiKey.length > 0
    ? { apiKey: gatewayApiKey }
    : {} // Empty object allows OIDC to work on Vercel
);

export const generateResponse = async (
  messages: ModelMessage[],
  updateStatus?: (status: string) => void,
  slackThreadUrl?: string,
) => {
  const { text } = await generateText({
    model: gateway("openai/gpt-4o"),
    system: `You are an intake assistant representing the Vercel Developer Success (DS) team in Slack.

Your role is NOT to solve technical problems directly, but to:
1. Acknowledge the request and confirm it's in-scope for DS
2. Explain how the DS team can help with this type of request
3. Offer to create a DS support ticket for tracking and assignment to the team

## DS Team Capabilities (explain these when relevant to the request):

**Time-boxed onboarding & enablement:**
- Structured onboarding sessions for Vercel features and best practices
- Go-live support and hypercare for critical launches

**Deep technical debugging & performance:**
- Investigating cold starts, latency, routing, caching, ISR behavior
- Using observability, tracing, and logs to diagnose issues
- Reproducing problems and recommending fixes

**Usage, cost, and efficiency guidance:**
- Analyzing usage drivers (Fast Data Transfer, Edge Requests, ISR writes)
- Investigating overage spikes after framework upgrades or config changes
- Performance vs cost optimization recommendations

**Product & feature guidance:**
- How to use Vercel features (Skew Protection, Session Tracing, Bot Protection, etc.)
- Framework behavior on Vercel (Next.js caching, routing, prefetching)

**AI SDK support:**
- Implementation help and best practices for Vercel AI SDK

## Response Format:

1. **Acknowledge the request** - Show you understand what they need
2. **Confirm DS scope** - Briefly explain how DS can help with this type of issue
3. **Set expectations** - Mention that DS will investigate/provide guidance (not that YOU will solve it)
4. **Create the ticket** - Use the createTicket tool to create a DS support ticket for tracking. Do this automatically - don't ask for permission.

## Important Guidelines:
- Do NOT provide technical solutions, code examples, or step-by-step troubleshooting
- Do NOT act as if you are solving the problem yourself
- Do NOT say "I can help you with..." - instead say "The DS team can help with..."
- DO explain what DS team members will do when they pick up the request
- Keep responses concise (2-4 paragraphs maximum)
- Do not tag users
- Current date is: ${new Date().toISOString().split("T")[0]}

## Customer Context Extraction (for ticket creation):
When offering to create a ticket, you need to extract:
- Customer identifiers, company names, or account information
- Vercel team IDs (format: team_XXXXXXXXXXXXXXXXXXXXXXXX)
- Project IDs (format: prj_XXXXXXXXXXXXXXXXXXXXXXXX)
- Customer segment if mentioned (Enterprise, Pro, Hobby)
- Urgency and impact to determine priority (production issues = higher priority)

After acknowledging their request and explaining how DS can help, ALWAYS create a ticket automatically by using the createTicket tool. Do not ask for permission - just create it and let them know it's been created.`,
    messages,
    tools: {
      createTicket: tool({
        description: "Post a DS support ticket request to the Linear channel. Use this tool to AUTOMATICALLY create a ticket after acknowledging the request and explaining how DS can help. ALWAYS create a ticket for in-scope requests - do not ask for permission. Extract as much customer context as possible from the conversation and generate a concise summary.",
        inputSchema: z.object({
          customer: z.string().describe("Customer identifier or email of the person requesting support"),
          customerName: z.string().describe("Customer's company/organization name"),
          customerSegment: z.enum(["Enterprise", "Pro", "Hobby", "Unknown"]).optional().describe("Customer's Vercel plan segment if known from context"),
          teamId: z.string().describe("Customer's Vercel team ID in format team_XXXXXXXXXXXXXXXXXXXXXXXX. If not provided in conversation, use 'team_unknown'"),
          notionLink: z.string().optional().describe("Notion link for account tracking if the customer account is known. Find it at https://www.notion.so/vercel/1b6e06b059c48055a637c5f6de528de7"),
          projectId: z.string().optional().describe("Customer's Vercel project ID in format prj_XXXXXXXXXXXXXXXXXXXXXXXX if mentioned in the conversation"),
          priority: z.enum(["🔴 SEV 1/Urgent", "🟠 SEV 2/High", "🟡 SEV 3/Non-Urgent"]).optional().describe("Priority level based on urgency and customer impact. Default to SEV 3 unless customer is blocked or experiencing production issues"),
          elevatedPriorityContext: z.string().optional().describe("If priority is SEV 1 or SEV 2, provide context explaining why it's urgent (e.g., production down, customer escalation)"),
          issueCategory: z.enum([
            "technical-troubleshooting",
            "onboarding-enablement",
            "performance-optimization",
            "usage-cost-guidance",
            "product-feature-guidance",
            "ai-sdk-support"
          ]).describe("Category of the issue for internal tracking (only in-scope DS categories)"),
          issueSummary: z.string().describe("A concise 2-4 sentence summary of the issue/request from the conversation. Focus on the problem, impact, and what the customer needs help with. Do NOT copy the entire conversation - just summarize the key points."),
        }),
        execute: async ({
          customer,
          customerName,
          customerSegment,
          teamId,
          notionLink,
          projectId,
          priority,
          elevatedPriorityContext,
          issueCategory,
          issueSummary,
        }: {
          customer: string;
          customerName: string;
          customerSegment?: "Enterprise" | "Pro" | "Hobby" | "Unknown";
          teamId: string;
          notionLink?: string;
          projectId?: string;
          priority?: "🔴 SEV 1/Urgent" | "🟠 SEV 2/High" | "🟡 SEV 3/Non-Urgent";
          elevatedPriorityContext?: string;
          issueCategory: "technical-troubleshooting" | "onboarding-enablement" | "performance-optimization" | "usage-cost-guidance" | "product-feature-guidance" | "ai-sdk-support";
          issueSummary: string;
        }) => {
          updateStatus?.("is posting ticket to DS team channel...");

          // Use the AI-generated summary instead of copying all messages
          const requestWithThread = slackThreadUrl
            ? `${issueSummary}\n\n_Slack Thread:_ ${slackThreadUrl}`
            : issueSummary;

          try {
            const result = await postTicketCreationMessage({
              customer,
              customerName,
              customerSegment,
              teamId,
              notionLink,
              projectId,
              priority,
              elevatedPriorityContext,
              request: requestWithThread,
              slackThreadUrl,
              issueCategory,
            });

            return {
              success: true,
              message: `✅ Posted ticket to DS team channel! The team can now use Linear's Slack bot to create a ticket with:\n- Customer: ${customerName}\n- Team ID: ${teamId}\n- Priority: ${priority || "🟡 SEV 3/Non-Urgent"}`,
              channelId: result.channelId,
            };
          } catch (error) {
            console.error("Failed to post ticket creation message:", error);
            return {
              success: false,
              error: `Failed to post ticket: ${error instanceof Error ? error.message : "Unknown error"}`,
            };
          }
        },
      }),
    },
  });

  // Convert markdown to Slack mrkdwn format
  return text.replace(/\[(.*?)\]\((.*?)\)/g, "<$2|$1>").replace(/\*\*/g, "*");
};
