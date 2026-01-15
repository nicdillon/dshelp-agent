// Slack event types
type AppMentionEvent = any;
import { client, getThread, getChannelHistory } from "./slack-utils";
import { generateResponse } from "./generate-response";
import { classifyRequest } from "./classify-request";
import { generateRoutingResponse } from "./generate-routing-response";

const updateStatusUtil = async (
  initialStatus: string,
  event: AppMentionEvent,
) => {
  // Post ephemeral status (only visible to user who mentioned bot)
  await client.chat.postEphemeral({
    channel: event.channel,
    user: event.user,
    text: initialStatus || "Processing your request...",
  });

  const updateMessage = async (status: string) => {
    // Validate that we have text to post
    if (!status || status.trim().length === 0) {
      console.error("Attempted to post ephemeral message with empty text");
      status = "⚠️ Error: Unable to generate response. Please try again.";
    }

    // Post new ephemeral message (can't update ephemeral messages)
    await client.chat.postEphemeral({
      channel: event.channel,
      user: event.user,
      text: status,
    });
  };
  return updateMessage;
};

export async function handleNewAppMention(
  event: AppMentionEvent,
  botUserId: string,
) {
  console.log("Handling app mention");
  if (event.bot_id || event.bot_id === botUserId || event.bot_profile) {
    console.log("Skipping app mention");
    return;
  }

  // NOTE: All agent responses are posted as ephemeral messages (only visible to user who @mentioned bot)
  // This prevents customers from seeing internal routing discussions
  // DSE ticket creation messages to the ticket channel remain public (not ephemeral)

  const { thread_ts, channel } = event;
  const updateMessage = await updateStatusUtil("is analyzing your request...", event);

  try {
    let messages;
    if (thread_ts) {
      messages = await getThread(channel, thread_ts, botUserId);
    } else {
      messages = [{ role: "user" as const, content: event.text }];
    }

    // Retrieve channel history for additional context
    const channelHistory = await getChannelHistory(channel, botUserId, 100);

    // Classify the request to check if it's in DS scope
    const classification = await classifyRequest(messages);

    console.log(`App mention classification:`, JSON.stringify(classification));

    let result: string;

    if (!classification.isInScope) {
      // Out of scope - provide routing guidance
      result = generateRoutingResponse({
        category: classification.category,
        suggestedTeam: classification.suggestedTeam,
        reasoning: classification.reasoning,
      });
    } else {
      // In scope - generate full response
      await updateMessage("is working on your request...");

      // Build Slack thread URL
      const threadTs = thread_ts ?? event.ts;
      const slackThreadUrl = `https://slack.com/app_redirect?channel=${channel}&thread_ts=${threadTs}`;

      result = await generateResponse(messages, updateMessage, slackThreadUrl, channelHistory);
    }

    await updateMessage(result);
  } catch (error) {
    console.error("Error handling app mention:", error);
    await updateMessage(
      "⚠️ An error occurred while processing your request. Please check the logs or try again."
    );
  }
}
