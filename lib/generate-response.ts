import { ModelMessage, generateText, tool } from "ai";
import { createGateway } from "@ai-sdk/gateway";
import { z } from "zod";
import { exa } from "./utils";
import { postTicketCreationMessage } from "./create-ticket-message";

const gateway = createGateway({
  apiKey: process.env.AI_GATEWAY_API_KEY,
});

export const generateResponse = async (
  messages: ModelMessage[],
  updateStatus?: (status: string) => void,
  slackThreadUrl?: string,
) => {
  const { text } = await generateText({
    model: gateway("openai/gpt-4o"),
    system: `You are the Vercel Developer Success (DS) team AI assistant in Slack.

Your expertise includes:
- Technical troubleshooting for Vercel and Next.js issues
- Best practices and architecture guidance for web applications
- AI SDK implementation and usage
- Customer-specific technical issues with Vercel platform

Guidelines:
- Keep responses concise and to the point
- Focus on actionable solutions and clear explanations
- Use examples and code snippets when helpful
- Do not tag users
- Current date is: ${new Date().toISOString().split("T")[0]}
- When using web search, ALWAYS include sources inline in your response
- If you're unsure about something, be honest and suggest where to find more information

Customer Context Extraction:
- Pay close attention to any customer identifiers, company names, or account information mentioned
- Look for Vercel team IDs (format: team_XXXXXXXXXXXXXXXXXXXXXXXX)
- Look for project IDs (format: prj_XXXXXXXXXXXXXXXXXXXXXXXX)
- Note the customer segment if mentioned (Enterprise, Pro, Hobby)
- Assess urgency and impact to determine priority (production issues = higher priority)

Remember: You're here to provide technical guidance and help developers succeed with Vercel products.

After providing your initial response to in-scope requests, you can offer to create a Linear ticket for tracking and follow-up by using the createTicket tool. Make sure to extract as much customer context as possible from the conversation.`,
    messages,
    tools: {
      createTicket: tool({
        description: "Post a DS support ticket request to the Linear channel. Use this AFTER providing your initial response when the request is in-scope and may need follow-up or tracking. Extract as much customer context as possible from the conversation.",
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
            "best-practices",
            "customer-issue",
            "ai-sdk-support"
          ]).describe("Category of the issue for internal tracking"),
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
        }) => {
          updateStatus?.("is posting ticket to DS team channel...");

          // Get the full conversation context for the request
          const userMessages = messages.filter(m => m.role === "user");
          const fullRequest = userMessages
            .map(m =>
              typeof m.content === "string"
                ? m.content
                : JSON.stringify(m.content)
            )
            .join("\n\n");

          const requestWithThread = slackThreadUrl
            ? `${fullRequest}\n\n_Slack Thread:_ ${slackThreadUrl}`
            : fullRequest;

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
      getWeather: tool({
        description: "Get the current weather at a location",
        inputSchema: z.object({
          latitude: z.number(),
          longitude: z.number(),
          city: z.string(),
        }),
        execute: async ({ latitude, longitude, city }) => {
          updateStatus?.(`is getting weather for ${city}...`);

          const response = await fetch(
            `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,weathercode,relativehumidity_2m&timezone=auto`,
          );

          const weatherData = await response.json();
          return {
            temperature: weatherData.current.temperature_2m,
            weatherCode: weatherData.current.weathercode,
            humidity: weatherData.current.relativehumidity_2m,
            city,
          };
        },
      }),
      searchWeb: tool({
        description: "Use this to search the web for information",
        inputSchema: z.object({
          query: z.string(),
          specificDomain: z
            .string()
            .nullable()
            .describe(
              "a domain to search if the user specifies e.g. bbc.com. Should be only the domain name without the protocol",
            ),
        }),
        execute: async ({ query, specificDomain }) => {
          updateStatus?.(`is searching the web for ${query}...`);
          const { results } = await exa.searchAndContents(query, {
            livecrawl: "always",
            numResults: 3,
            includeDomains: specificDomain ? [specificDomain] : undefined,
          });

          return {
            results: results.map((result) => ({
              title: result.title,
              url: result.url,
              snippet: result.text.slice(0, 1000),
            })),
          };
        },
      }),
    },
  });

  // Convert markdown to Slack mrkdwn format
  return text.replace(/\[(.*?)\]\((.*?)\)/g, "<$2|$1>").replace(/\*\*/g, "*");
};
