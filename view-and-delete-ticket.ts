/**
 * Script to view and delete a specific ticket
 */

// Load environment variables FIRST before any other imports
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

import { client } from './lib/slack-utils';

const CHANNEL_ID = process.env.SLACK_TICKET_CHANNEL_ID || '';

async function findAndDeleteTestTicket() {
  console.log(`\n🔍 Fetching recent messages from channel ${CHANNEL_ID}...\n`);

  // Fetch recent messages from channel
  const { messages } = await client.conversations.history({
    channel: CHANNEL_ID,
    limit: 50, // Get last 50 messages to find older ones
  });

  if (!messages || messages.length === 0) {
    console.log('No messages found.');
    return;
  }

  console.log(`Found ${messages.length} recent message(s):\n`);

  // Display all recent messages and find ones mentioning "team_test"
  messages.forEach((msg, index) => {
    const timestamp = new Date(parseFloat(msg.ts!) * 1000).toISOString();
    const localTime = new Date(parseFloat(msg.ts!) * 1000).toLocaleString('en-US', {
      timeZone: 'America/Los_Angeles',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
      month: 'short',
      day: 'numeric'
    });
    const preview = msg.text ? msg.text.substring(0, 100) : '[No text]';
    console.log(`${index + 1}. [${localTime}] [${timestamp}]`);
    console.log(`   Preview: ${preview}`);

    // Check if message contains "team_test"
    if (msg.blocks) {
      const blockText = JSON.stringify(msg.blocks);
      if (blockText.includes('team_test')) {
        console.log(`   ⚠️  Contains "team_test"`);
      }
    }
    console.log('');
  });

  // Find ALL tickets with team_test
  const testTickets = messages.filter(msg => {
    // Check in blocks for team_test
    if (msg.blocks) {
      const blockText = JSON.stringify(msg.blocks);
      return blockText.includes('team_test');
    }
    return false;
  });

  if (testTickets.length === 0) {
    console.log('❌ No tickets found with team_test');
    return;
  }

  console.log(`\nFound ${testTickets.length} ticket(s) with team_test\n`);

  // Show all matching tickets with their times
  testTickets.forEach((msg, index) => {
    const timestamp = new Date(parseFloat(msg.ts!) * 1000).toISOString();
    const localTime = new Date(parseFloat(msg.ts!) * 1000).toLocaleString('en-US', {
      timeZone: 'America/Los_Angeles',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
      month: 'short',
      day: 'numeric'
    });
    console.log(`${index + 1}. [${localTime}] - ${msg.text?.substring(0, 80)}`);
  });

  // Filter for the two most recent messages from today with team_test
  const recentTickets = testTickets.filter(msg => {
    const date = new Date(parseFloat(msg.ts!) * 1000);
    const today = new Date();
    // Check if it's from today (Jan 29)
    return date.getDate() === 29 && date.getMonth() === 0;
  }).slice(0, 2); // Get the 2 most recent

  console.log(`\nFiltered to ${recentTickets.length} most recent ticket(s) from today\n`);

  if (recentTickets.length === 0) {
    console.log('❌ No recent tickets found');
    return;
  }

  // Delete all matching tickets
  for (const ticket of recentTickets) {
    console.log('='.repeat(80));
    console.log(`Timestamp: ${new Date(parseFloat(ticket.ts!) * 1000).toISOString()}`);
    console.log(`Message TS: ${ticket.ts}`);
    console.log(`Text: ${ticket.text?.substring(0, 100)}`);
    console.log('='.repeat(80));
    console.log('🗑️  DELETING MESSAGE...\n');

    try {
      await client.chat.delete({
        channel: CHANNEL_ID,
        ts: ticket.ts!,
      });
      console.log('✅ Successfully deleted the ticket message\n');
    } catch (error) {
      console.error('❌ Failed to delete message:', error);
    }
  }
}

// Run the script
findAndDeleteTestTicket().catch(error => {
  console.error('Error:', error);
  process.exit(1);
});
