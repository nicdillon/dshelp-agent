import { WebClient } from '@slack/web-api';
import { ModelMessage } from 'ai'
import crypto from 'crypto'

// Validate and sanitize environment variables
const slackBotToken = process.env.SLACK_BOT_TOKEN?.trim();
const signingSecretRaw = process.env.SLACK_SIGNING_SECRET?.trim();

if (!slackBotToken) {
  throw new Error('SLACK_BOT_TOKEN environment variable is not set or is empty');
}

if (!signingSecretRaw) {
  throw new Error('SLACK_SIGNING_SECRET environment variable is not set or is empty');
}

// Type-safe after validation
const signingSecret: string = signingSecretRaw;

export const client = new WebClient(slackBotToken);

// See https://api.slack.com/authentication/verifying-requests-from-slack
export async function isValidSlackRequest({
  request,
  rawBody,
}: {
  request: Request
  rawBody: string
}) {
  // console.log('Validating Slack request')
  const timestamp = request.headers.get('X-Slack-Request-Timestamp')
  const slackSignature = request.headers.get('X-Slack-Signature')
  // console.log(timestamp, slackSignature)

  if (!timestamp || !slackSignature) {
    console.log('Missing timestamp or signature')
    return false
  }

  // Prevent replay attacks on the order of 5 minutes
  if (Math.abs(Date.now() / 1000 - parseInt(timestamp)) > 60 * 5) {
    console.log('Timestamp out of range')
    return false
  }

  const base = `v0:${timestamp}:${rawBody}`
  const hmac = crypto
    .createHmac('sha256', signingSecret)
    .update(base)
    .digest('hex')
  const computedSignature = `v0=${hmac}`

  // Prevent timing attacks
  return crypto.timingSafeEqual(
    Buffer.from(computedSignature),
    Buffer.from(slackSignature)
  )
}

export const verifyRequest = async ({
  requestType,
  request,
  rawBody,
}: {
  requestType: string;
  request: Request;
  rawBody: string;
}) => {
  const validRequest = await isValidSlackRequest({ request, rawBody });
  if (!validRequest || requestType !== "event_callback") {
    return new Response("Invalid request", { status: 400 });
  }
};

export const updateStatusUtil = (channel: string, thread_ts: string) => {
  return async (status: string) => {
    await client.assistant.threads.setStatus({
      channel_id: channel,
      thread_ts: thread_ts,
      status: status,
    });
  };
};

export async function getThread(
  channel_id: string,
  thread_ts: string,
  botUserId: string,
): Promise<ModelMessage[]> {
  const { messages } = await client.conversations.replies({
    channel: channel_id,
    ts: thread_ts,
    limit: 50,
  });

  // Ensure we have messages

  if (!messages) throw new Error("No messages found in thread");

  const result = messages
    .map((message) => {
      const isBot = !!message.bot_id;
      if (!message.text) return null;

      // For app mentions, remove the mention prefix
      // For IM messages, keep the full text
      let content = message.text;
      if (!isBot && content.includes(`<@${botUserId}>`)) {
        content = content.replace(`<@${botUserId}> `, "");
      }

      return {
        role: isBot ? "assistant" : "user",
        content: content,
      } as ModelMessage;
    })
    .filter((msg): msg is ModelMessage => msg !== null);

  return result;
}

export async function getChannelHistory(
  channel_id: string,
  botUserId: string,
  limit: number = 100,
): Promise<string> {
  const { messages } = await client.conversations.history({
    channel: channel_id,
    limit: limit,
  });

  if (!messages) return "";

  // Format messages as contextual history
  const contextHistory = messages
    .reverse() // Show oldest first for chronological order
    .map((message) => {
      if (!message.text) return null;

      // Filter out only THIS bot's messages (keep other bots like d0)
      const isDshelpBot = message.bot_id === botUserId || message.user === botUserId;
      if (isDshelpBot) return null;

      // Skip very short messages (reactions, "ok", "thanks", etc.)
      const trimmedText = message.text.trim();
      if (trimmedText.length < 10) return null;

      let content = trimmedText;

      // Clean up Slack formatting
      // Remove bot mentions
      content = content.replace(new RegExp(`<@${botUserId}>\\s*`, 'g'), "");

      // Simplify links: <http://example.com|example.com> → http://example.com
      content = content.replace(/<(https?:\/\/[^|>]+)\|[^>]+>/g, '$1');
      content = content.replace(/<(https?:\/\/[^>]+)>/g, '$1');

      // Remove user mentions format but keep the ID for reference
      content = content.replace(/<@(U[A-Z0-9]+)>/g, '@$1');

      // Collapse multiple whitespaces/newlines
      content = content.replace(/\s+/g, ' ').trim();

      // Format with shortened timestamp
      const timestamp = message.ts
        ? new Date(parseFloat(message.ts) * 1000).toISOString().slice(0, 16).replace('T', ' ')
        : "";

      return `[${timestamp}] ${content}`;
    })
    .filter((msg): msg is string => msg !== null)
    .join("\n");

  return contextHistory;
}

export const getBotId = async () => {
  const { user_id: botUserId } = await client.auth.test();

  if (!botUserId) {
    throw new Error("botUserId is undefined");
  }
  return botUserId;
};
