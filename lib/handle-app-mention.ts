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
  const initialMessage = await client.chat.postMessage({
    channel: event.channel,
    thread_ts: event.thread_ts ?? event.ts,
    text: initialStatus,
  });

  if (!initialMessage || !initialMessage.ts)
    throw new Error("Failed to post initial message");

  const updateMessage = async (status: string) => {
    await client.chat.update({
      channel: event.channel,
      ts: initialMessage.ts as string,
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

  const { thread_ts, channel } = event;
  const updateMessage = await updateStatusUtil("is analyzing your request...", event);

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
}
