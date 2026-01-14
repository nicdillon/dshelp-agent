/**
 * Cleanup script to delete test messages posted by the bot
 *
 * Usage:
 * 1. Set the channel ID and time range below
 * 2. Run: npx tsx cleanup-test-messages.ts
 * 3. Review the messages that will be deleted
 * 4. Confirm to delete them
 */

import { client } from './lib/slack-utils';
import readline from 'readline';

// Configuration
const CHANNEL_ID = process.env.SLACK_TICKET_CHANNEL_ID || 'YOUR_CHANNEL_ID';
const DELETE_MESSAGES_FROM_LAST_HOURS = 1; // Only look at messages from last N hours

async function findBotMessages() {
  console.log(`\n🔍 Searching for bot messages in channel ${CHANNEL_ID}...`);

  // Get bot's own user ID
  const { user_id: botUserId } = await client.auth.test();
  console.log(`Bot user ID: ${botUserId}\n`);

  // Calculate timestamp for oldest message to fetch (N hours ago)
  const oldestTimestamp = (Date.now() / 1000) - (DELETE_MESSAGES_FROM_LAST_HOURS * 3600);

  // Fetch recent messages from channel
  const { messages } = await client.conversations.history({
    channel: CHANNEL_ID,
    oldest: oldestTimestamp.toString(),
    limit: 100,
  });

  if (!messages) {
    console.log('No messages found.');
    return [];
  }

  // Filter to only bot's messages
  const botMessages = messages.filter(msg => msg.user === botUserId || msg.bot_id);

  console.log(`Found ${botMessages.length} bot message(s) from the last ${DELETE_MESSAGES_FROM_LAST_HOURS} hour(s):\n`);

  // Display messages
  botMessages.forEach((msg, index) => {
    const timestamp = new Date(parseFloat(msg.ts!) * 1000).toISOString();
    const preview = msg.text ? msg.text.substring(0, 100) : '[No text]';
    console.log(`${index + 1}. [${timestamp}] ${preview}...`);
  });

  return botMessages;
}

async function deleteMessages(messages: any[]) {
  console.log(`\n🗑️  Deleting ${messages.length} message(s)...\n`);

  let successCount = 0;
  let failCount = 0;

  for (const msg of messages) {
    try {
      await client.chat.delete({
        channel: CHANNEL_ID,
        ts: msg.ts!,
      });
      console.log(`✅ Deleted message from ${new Date(parseFloat(msg.ts!) * 1000).toISOString()}`);
      successCount++;
    } catch (error) {
      console.error(`❌ Failed to delete message: ${error}`);
      failCount++;
    }
  }

  console.log(`\n✅ Successfully deleted: ${successCount}`);
  if (failCount > 0) {
    console.log(`❌ Failed to delete: ${failCount}`);
  }
}

async function promptConfirmation(): Promise<boolean> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve) => {
    rl.question('\n⚠️  Do you want to delete these messages? (yes/no): ', (answer) => {
      rl.close();
      resolve(answer.toLowerCase() === 'yes' || answer.toLowerCase() === 'y');
    });
  });
}

async function main() {
  try {
    console.log('=' .repeat(80));
    console.log('CLEANUP TEST MESSAGES');
    console.log('=' .repeat(80));

    // Check for --yes flag
    const autoConfirm = process.argv.includes('--yes') || process.argv.includes('-y');

    // Find bot messages
    const botMessages = await findBotMessages();

    if (botMessages.length === 0) {
      console.log('\n✅ No bot messages to delete.');
      return;
    }

    // Confirm deletion
    let confirmed = autoConfirm;
    if (!autoConfirm) {
      confirmed = await promptConfirmation();
    } else {
      console.log('\n✅ Auto-confirming deletion (--yes flag provided)');
    }

    if (!confirmed) {
      console.log('\n❌ Deletion cancelled.');
      return;
    }

    // Delete messages
    await deleteMessages(botMessages);

    console.log('\n✅ Cleanup complete!');

  } catch (error) {
    console.error('\n❌ Error during cleanup:', error);

    if (error instanceof Error && error.message.includes('missing_scope')) {
      console.error('\n⚠️  The bot needs the "chat:write" scope to delete messages.');
      console.error('Please add this scope in your Slack app settings and reinstall the bot.');
    }

    process.exit(1);
  }
}

main();
