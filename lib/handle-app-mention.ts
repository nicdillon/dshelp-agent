// Slack event types
type AppMentionEvent = any;
import { client, getThread, getChannelHistory, findRelevantThreads } from "./slack-utils";
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
    console.log('[handleNewAppMention] Processing mention from user:', event.user);
    console.log('[handleNewAppMention] Event text:', event.text);
    console.log('[handleNewAppMention] Channel:', channel, 'Thread:', thread_ts);

    let messages;
    if (thread_ts) {
      console.log('[handleNewAppMention] Fetching thread messages');
      messages = await getThread(channel, thread_ts, botUserId);
    } else {
      console.log('[handleNewAppMention] No thread, using direct message');
      // Remove bot mention from the message
      const cleanedText = event.text.replace(`<@${botUserId}>`, '').trim();
      messages = [{ role: "user" as const, content: cleanedText }];
    }
    console.log('[handleNewAppMention] Messages count:', messages.length);

    // Retrieve channel history for additional context
    console.log('[handleNewAppMention] Fetching channel history');
    const channelHistory = await getChannelHistory(channel, botUserId, 100);
    console.log('[handleNewAppMention] Channel history length:', channelHistory.length);

    // Find relevant threads (only if not already in a thread)
    let enrichedContext = '';
    if (!thread_ts) {
      console.log('[handleNewAppMention] Finding relevant threads in channel');
      await updateMessage("is searching channel threads for context...");

      const threadDiscovery = await findRelevantThreads(channel, event.text, botUserId);
      console.log('[handleNewAppMention] Thread discovery summary:', threadDiscovery.summary);

      if (threadDiscovery.relevantThreads.length > 0) {
        // Format threads for context
        enrichedContext = '\n\n## Relevant Thread Context:\n\n' +
          threadDiscovery.relevantThreads.map(thread => {
            return `**Thread about:** ${thread.relevanceReason}\n` +
              `**Root message:** ${thread.rootMessage}\n` +
              `**Thread replies:**\n${thread.threadMessages.join('\n')}`;
          }).join('\n\n---\n\n');

        console.log('[handleNewAppMention] Added', threadDiscovery.relevantThreads.length, 'threads to context');
      }
    } else {
      console.log('[handleNewAppMention] Already in a thread, skipping thread discovery');
    }

    // Classify the request to check if it's in DS scope
    console.log('[handleNewAppMention] Starting classification');
    await updateMessage("is analyzing your request...");
    const classification = await classifyRequest(messages, enrichedContext);

    console.log(`[handleNewAppMention] Classification result:`, JSON.stringify(classification));

    let result: string;

    if (!classification.isInScope) {
      console.log('[handleNewAppMention] Request is OUT OF SCOPE');
      // Out of scope - provide routing guidance
      result = generateRoutingResponse({
        category: classification.category,
        suggestedTeam: classification.suggestedTeam,
        reasoning: classification.reasoning,
      });
    } else {
      console.log('[handleNewAppMention] Request is IN SCOPE - generating response');
      // In scope - generate full response
      await updateMessage("is working on your request...");

      // Build Slack thread URL
      const threadTs = thread_ts ?? event.ts;
      const slackThreadUrl = `https://slack.com/app_redirect?channel=${channel}&thread_ts=${threadTs}`;

      console.log('[handleNewAppMention] Calling generateResponse');
      result = await generateResponse(messages, updateMessage, slackThreadUrl, channelHistory, enrichedContext);
      console.log('[handleNewAppMention] generateResponse returned, result length:', result?.length || 0);
    }

    console.log('[handleNewAppMention] About to post final result');
    await updateMessage(result);
    console.log('[handleNewAppMention] Successfully completed');
  } catch (error) {
    console.error("Error handling app mention:", error);
    await updateMessage(
      "⚠️ An error occurred while processing your request. Please check the logs or try again."
    );
  }
}
