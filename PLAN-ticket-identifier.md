# Plan: Add Agent Identifier to DSE Tickets

## Goal
Add machine-readable text to tickets created by the agent so automation can identify them in the #help-dev-success channel.

---

## Problem Statement

Currently, tickets created by the DSE Slack Agent look identical to manually created tickets. Automation needs a way to:
- Identify which tickets came from the agent
- Filter/process agent-created tickets differently
- Track agent-generated tickets over time

---

## Proposed Solution

**Recommended Approach: Dual-identifier system**
1. Add `[BOT]` prefix to text field (simple text search)
2. Add dedicated context block with structured metadata (API automation)

This provides redundancy and supports both simple and advanced automation scenarios.

---

## Implementation Details

### Change 1: Update Text Field

**File:** `lib/create-ticket-message.ts`
**Location:** Line 185 (approximately)

**Current:**
```typescript
text: `${issueTitle} - ${customerName}`
```

**New:**
```typescript
text: `[BOT] ${issueTitle} - ${customerName}`
```

**Why:**
- Simple to search: `msg.text.includes('[BOT]')`
- Visible in notifications and search results
- Works with basic Slack features

---

### Change 2: Add Agent Context Block

**File:** `lib/create-ticket-message.ts`
**Location:** After line 178 (after issueCategory context block)

**Add:**
```typescript
// Add agent source identifier
blocks.push({
  type: "context",
  elements: [
    {
      type: "mrkdwn",
      text: `🤖 Created by DSE Slack Agent | <https://github.com/nicdillon/dshelp-agent|View Source>`
    }
  ]
});
```

**Why:**
- Visually separated from main content
- Easy to parse with Slack API
- Provides link to source code for transparency
- Can be extended with more metadata later

---

### Optional Enhancement: Unique Ticket ID

**File:** `lib/create-ticket-message.ts`
**Location:** Beginning of `postTicketCreationMessage()` function

**Add ticket ID generation:**
```typescript
export const postTicketCreationMessage = async (details: TicketDetails) => {
  const ticketChannelId = process.env.SLACK_TICKET_CHANNEL_ID?.trim();

  if (!ticketChannelId) {
    throw new Error(
      "SLACK_TICKET_CHANNEL_ID not configured. Please set this environment variable to the channel where tickets should be created."
    );
  }

  // Generate unique ticket ID
  const ticketId = `agent-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

  // ... rest of function
```

**Update context block to include ID:**
```typescript
{
  type: "context",
  elements: [
    {
      type: "mrkdwn",
      text: `🤖 Created by DSE Slack Agent | Ticket ID: \`${ticketId}\` | <https://github.com/nicdillon/dshelp-agent|View Source>`
    }
  ]
}
```

**Update return value (optional):**
```typescript
return {
  success: true,
  channelId: ticketChannelId,
  messageTs: result.ts,
  ticketId: ticketId, // NEW
};
```

**Why:**
- Enables tracking of individual tickets
- Can correlate agent logs with tickets
- Useful for debugging and analytics

---

## Alternative Approaches Considered

### Option A: Only Text Prefix
**Pros:** Simple, works everywhere
**Cons:** Cluttered, limited metadata

### Option B: Only Context Block
**Pros:** Clean, structured
**Cons:** Requires block parsing in automation

### Option C: Slack Metadata API
```typescript
metadata: {
  event_type: "dse_ticket_created",
  event_payload: {
    source: "dse-slack-agent",
    ticket_id: ticketId,
    created_at: new Date().toISOString()
  }
}
```
**Pros:** Hidden from users, structured data
**Cons:** Requires API access, not visible in UI

**Decision:** Use Options A + B (dual-identifier) for maximum compatibility

---

## Automation Search Examples

### Simple Text Search (for basic automation)
```javascript
// Find all bot-created tickets
const botTickets = messages.filter(msg =>
  msg.text?.startsWith('[BOT]')
);
```

### Block-based Search (for advanced automation)
```javascript
// Find tickets by context block
const botTickets = messages.filter(msg =>
  msg.blocks?.some(block =>
    block.type === 'context' &&
    block.elements?.some(el =>
      el.text?.includes('Created by DSE Slack Agent')
    )
  )
);
```

### Extract Ticket ID (if implemented)
```javascript
// Parse ticket ID from context block
const ticketIdMatch = contextText.match(/Ticket ID: `([^`]+)`/);
const ticketId = ticketIdMatch ? ticketIdMatch[1] : null;
```

---

## Testing Plan

### Manual Testing

1. **Deploy changes** to test environment
2. **Trigger agent** to create a ticket:
   ```
   @Dev Success Support Agent create a ticket for cold start investigation
   ```
3. **Verify in #help-dev-success:**
   - [ ] Message text starts with `[BOT]`
   - [ ] Context block shows "🤖 Created by DSE Slack Agent"
   - [ ] GitHub link is clickable
   - [ ] Ticket ID is present (if implemented)
   - [ ] Ticket is otherwise identical to before

### Automation Testing

Create a test script to verify automation can find bot tickets:

```typescript
// test-ticket-detection.ts
import { client } from './lib/slack-utils';

async function testTicketDetection() {
  const channelId = process.env.SLACK_TICKET_CHANNEL_ID;

  // Fetch recent messages
  const result = await client.conversations.history({
    channel: channelId,
    limit: 10
  });

  // Test text-based detection
  const textBasedBotTickets = result.messages?.filter(msg =>
    msg.text?.includes('[BOT]')
  );

  // Test block-based detection
  const blockBasedBotTickets = result.messages?.filter(msg =>
    msg.blocks?.some(block =>
      block.type === 'context' &&
      JSON.stringify(block).includes('Created by DSE Slack Agent')
    )
  );

  console.log('Text-based detection found:', textBasedBotTickets?.length);
  console.log('Block-based detection found:', blockBasedBotTickets?.length);

  // Should match
  console.assert(
    textBasedBotTickets?.length === blockBasedBotTickets?.length,
    'Both detection methods should find same number of tickets'
  );
}
```

---

## Files to Modify

1. **lib/create-ticket-message.ts** (PRIMARY)
   - Update text field with `[BOT]` prefix
   - Add agent context block
   - (Optional) Add ticket ID generation

2. **lib/generate-response.ts** (OPTIONAL)
   - Log/track returned ticket ID if implemented

---

## Rollout Strategy

### Phase 1: Basic Implementation
- Add `[BOT]` prefix to text
- Add context block with agent identifier
- Test manually

### Phase 2: Enhanced Tracking (Optional)
- Add unique ticket ID generation
- Update return value to include ticket ID
- Build automation to track ticket IDs

### Phase 3: Analytics (Future)
- Collect metrics on agent-created tickets
- Track ticket resolution times
- Compare agent vs. manual ticket quality

---

## Success Metrics

After implementation:
- [ ] All agent-created tickets are identifiable via text search
- [ ] All agent-created tickets have context block
- [ ] Automation can reliably detect agent tickets
- [ ] Human readability is not negatively impacted
- [ ] No breaking changes to existing ticket creation

---

## Open Questions

1. **Should ticket ID be included in Phase 1?**
   - Recommendation: Yes, minimal overhead and enables future tracking

2. **Should we track ticket IDs in a database/log?**
   - Recommendation: Not initially - can add later if needed

3. **Should the [BOT] prefix be configurable?**
   - Recommendation: No, keep it simple and consistent

4. **Should we add metadata API?**
   - Recommendation: Not initially - can add in Phase 2 if needed

---

## Maintenance Notes

- Context block text should remain consistent for automation reliability
- If changing identifier format, provide migration period for existing automation
- Document any identifier changes in release notes

---

**Status:** Planning
**Priority:** Medium
**Effort:** Small (< 1 hour)
**Risk:** Low (non-breaking changes)
