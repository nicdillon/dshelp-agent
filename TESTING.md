# Testing the DSE Agent Safely

## ⚠️ IMPORTANT: Avoiding Accidental Slack Posts

The DSE agent posts messages to Slack channels when creating tickets. To test safely:

## Current Test Suite: `test-agent.ts`

**What it tests:**
- ✅ Request classification (in-scope vs out-of-scope)
- ✅ Category assignment
- ✅ Team routing recommendations

**What it does NOT test:**
- ❌ Response generation
- ❌ Ticket creation
- ❌ Slack message posting

This is intentional to prevent accidental posts to production channels.

## Running the Classification Tests

```bash
# Load environment variables and run classification tests
set -a && source .env.local && set +a && npx tsx test-agent.ts
```

These tests are safe - they only call the LLM for classification, not ticket creation.

## Testing Response Generation Safely

If you need to test full response generation and ticket creation:

### Option 1: Use a Test Slack Workspace (Recommended)

1. Create a separate test Slack workspace
2. Install the bot in the test workspace
3. Create a test channel for tickets
4. Update `.env.local` with test credentials:
   ```
   SLACK_BOT_TOKEN=xoxb-test-...
   SLACK_TICKET_CHANNEL_ID=C123TEST...  # Must include "test" in ID
   ```
5. Run tests in the test workspace

### Option 2: Mock the Slack Client

Create a separate test file that mocks the Slack client before importing:

```typescript
// test-full-agent.ts
import { jest } from '@jest/globals';

// Mock Slack client BEFORE importing any modules
jest.mock('./lib/slack-utils', () => ({
  client: {
    chat: {
      postMessage: jest.fn().mockResolvedValue({
        ok: true,
        ts: '1234567890.123456',
      }),
    },
  },
}));

// Now import and test
import { generateResponse } from './lib/generate-response';
// ... test code
```

### Option 3: Manual Testing in Dedicated Test Channel

1. Create a dedicated `#dse-agent-testing` channel in your Slack workspace
2. Set `SLACK_TICKET_CHANNEL_ID` to this test channel temporarily
3. Test manually by @mentioning the bot
4. Delete test messages when done
5. **IMPORTANT:** Remember to restore production channel ID

## Safety Checks

The test suite includes safety warnings:
- Warns if `SLACK_TICKET_CHANNEL_ID` doesn't include "test"
- Clearly labels what is/isn't being tested
- Only tests classification by default

## What Happened Previously

The initial test run accidentally posted to the production `#help-dev-success` channel because:
- `generateResponse()` was called during tests
- This triggered the `createTicket` tool
- Which called `postTicketCreationMessage()`
- Which posted real messages to the configured channel

This has been fixed by removing response generation from the default test suite.
