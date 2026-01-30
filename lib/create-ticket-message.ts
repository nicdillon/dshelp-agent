import { client } from "./slack-utils";

interface TicketDetails {
  customer: string; // Customer identifier
  customerName: string; // Customer company name
  customerSegment?: string; // e.g., "Enterprise", "Pro", "Hobby"
  teamId: string; // Format: team_XXXXXXXXXXXXXXXXXXXXXXXX
  notionLink?: string; // Optional Notion account tracking link
  projectId?: string; // Format: prj_XXXXXXXXXXXXXXXXXXXXXXXX (optional)
  priority?: string; // e.g., "SEV 1/Urgent", "SEV 2/High", "SEV 3/Non-Urgent"
  elevatedPriorityContext?: string; // Context if priority is elevated
  request: string; // The main request/issue description
  slackThreadUrl?: string; // Link back to Slack thread
  issueCategory?: string; // For internal tracking
  issueTitle: string; // Concise title for the ticket
}

export const postTicketCreationMessage = async (details: TicketDetails) => {
  const ticketChannelId = process.env.SLACK_TICKET_CHANNEL_ID?.trim();

  if (!ticketChannelId) {
    throw new Error(
      "SLACK_TICKET_CHANNEL_ID not configured. Please set this environment variable to the channel where tickets should be created."
    );
  }

  const {
    customer,
    customerName,
    customerSegment,
    teamId,
    notionLink,
    projectId,
    priority,
    elevatedPriorityContext,
    request,
    slackThreadUrl,
    issueCategory,
    issueTitle,
  } = details;

  // Build a formatted message matching Linear Ask form
  const blocks: any[] = [
    {
      type: "header",
      text: {
        type: "plain_text",
        text: "🎫 DS Support Ticket Ready for Linear",
        emoji: true,
      },
    },
    {
      type: "section",
      text: {
        type: "mrkdwn",
        text: "_✅ Pre-debugging steps have been considered by the AI agent_\n\nUse Linear's Slack bot to create a ticket with the following details:",
      },
    },
    {
      type: "divider",
    },
  ];

  // Customer Information Section
  const customerFields: any[] = [
    {
      type: "mrkdwn",
      text: `*Customer:*\n${customer}`,
    },
    {
      type: "mrkdwn",
      text: `*Customer Name:*\n${customerName}`,
    },
  ];

  if (customerSegment) {
    customerFields.push({
      type: "mrkdwn",
      text: `*Customer Segment:*\n${customerSegment}`,
    });
  }

  blocks.push({
    type: "section",
    fields: customerFields,
  });

  // Team and Project IDs
  blocks.push({
    type: "section",
    fields: [
      {
        type: "mrkdwn",
        text: `*Team ID:*\n\`${teamId}\``,
      },
      projectId
        ? {
            type: "mrkdwn",
            text: `*Project ID:*\n\`${projectId}\``,
          }
        : {
            type: "mrkdwn",
            text: `*Project ID:*\n_Not provided_`,
          },
    ],
  });

  // Notion Link (if provided)
  if (notionLink) {
    blocks.push({
      type: "section",
      text: {
        type: "mrkdwn",
        text: `*Notion Link:*\n${notionLink}`,
      },
    });
  }

  blocks.push({
    type: "divider",
  });

  // Priority Section
  const priorityDisplay = priority || "🟡 SEV 3/Non-Urgent";
  blocks.push({
    type: "section",
    fields: [
      {
        type: "mrkdwn",
        text: `*Priority:*\n${priorityDisplay}`,
      },
    ],
  });

  if (elevatedPriorityContext) {
    blocks.push({
      type: "section",
      text: {
        type: "mrkdwn",
        text: `*Context on Elevated Priority:*\n${elevatedPriorityContext}`,
      },
    });
  }

  blocks.push({
    type: "divider",
  });

  // Request Section
  blocks.push({
    type: "section",
    text: {
      type: "mrkdwn",
      text: `*Request:*\n${request}`,
    },
  });

  // Slack Thread Link
  if (slackThreadUrl) {
    blocks.push({
      type: "section",
      text: {
        type: "mrkdwn",
        text: `*Slack Thread:*\n<${slackThreadUrl}|View original conversation>`,
      },
    });
  }

  // Internal tracking
  if (issueCategory) {
    blocks.push({
      type: "context",
      elements: [
        {
          type: "mrkdwn",
          text: `_AI Classification: ${issueCategory}_`,
        },
      ],
    });
  }

  // Build comprehensive plain text for Linear bot parsing
  // CRITICAL: Slack's Linear integration strips ALL newlines to spaces
  // This causes extraction patterns to fail or extract wrong text
  // Solution: Use delimiters that survive when collapsed

  let plainText = `**Request Form** submission • `;

  // Use backticks to delimit customer name - clear boundary even when collapsed
  plainText += `Customer: \`${customerName}\` • `;

  // Customer Segment with bullet separator
  if (customerSegment) {
    plainText += `Segment: ${customerSegment} • `;
  }

  // Put non-extractable fields next
  // Priority (safe - not a name)
  plainText += `Priority: ${priority || "🟡 SEV 3/Non-Urgent"} • `;

  // Context on Elevated Priority
  if (elevatedPriorityContext) {
    plainText += `Elevated Context: ${elevatedPriorityContext} • `;
  }

  // Notion Account Link (URLs are filtered out by validation)
  if (notionLink) {
    plainText += `Notion: ${notionLink} • `;
  }

  // Project ID (starts with prj_ so filtered out)
  if (projectId) {
    plainText += `Project: ${projectId} • `;
  }

  // Team ID with brackets to prevent extraction
  plainText += `[Team: ${teamId}] • `;

  // Admin link with clear URL marker
  if (teamId && teamId !== 'team_unknown') {
    plainText += `URL: https://admin.vercel.com/team/${teamId} • `;
  }

  // Request at the end
  plainText += `\n\n**Request:** ${request}`;

  // Internal tracking
  if (issueCategory) {
    plainText += `\n\n_AI Classification: ${issueCategory}_`;
  }

  try {
    const result = await client.chat.postMessage({
      channel: ticketChannelId,
      text: plainText,
      blocks: blocks,
    });

    return {
      success: true,
      channelId: ticketChannelId,
      messageTs: result.ts,
    };
  } catch (error) {
    console.error("Error posting ticket creation message:", error);
    throw error;
  }
};
