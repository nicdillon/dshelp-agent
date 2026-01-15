# Plan: LLM-Based Relevant Thread Discovery

## Overview
Add intelligent thread discovery that uses an LLM to identify which channel messages are relevant to the agent prompt, then fetches only those threads for context.

## Architecture Decision

**Approach: Automatic preprocessing step** (not a tool)
- Runs before classification
- Transparent to the agent
- Always provides enriched context when available

## Implementation Steps

### 1. Create new function: `findRelevantThreads()`
**Location:** `lib/slack-utils.ts`

**Inputs:**
- `channel_id`: string
- `userPrompt`: string (the @mention message)
- `botUserId`: string
- `topLevelMessages`: array (from getChannelHistory)

**Process:**
1. Extract key entities/topics from user prompt using LLM
2. Analyze top-level messages for relevance
3. Return list of relevant message timestamps
4. Fetch threads for those messages
5. Format as enriched context string

**Output:**
```typescript
{
  relevantThreads: Array<{
    rootMessage: string,
    threadMessages: string[],
    timestamp: string,
    relevanceReason: string
  }>,
  summary: string // "Found 3 relevant threads about cold starts, team IDs"
}
```

### 2. Add LLM-based relevance analyzer
**Function:** `analyzeMessageRelevance()`

**LLM Call:**
```typescript
Model: gateway("openai/gpt-4o-mini") // Cheaper/faster model
System prompt: "Analyze which messages are relevant to this request"
Input: User prompt + list of top-level messages
Output: Array of message timestamps + relevance scores
```

**Prompt Template:**
```
You are analyzing a Slack channel to find messages relevant to this request:
"${userPrompt}"

Here are the recent channel messages:
${formattedMessages}

Return a JSON array of relevant message timestamps with reasoning:
[
  { "ts": "1234567890.123", "reason": "Mentions team_abc123", "score": 0.9 },
  { "ts": "1234567891.456", "reason": "Discusses cold start performance", "score": 0.8 }
]

Only include messages with score >= 0.6
```

### 3. Update `handle-app-mention.ts`

**Current flow:**
```
1. Get thread (if in thread)
2. Get channel history (100 top-level messages)
3. Classify request
4. Generate response
```

**New flow:**
```
1. Get thread (if in thread)
2. Get channel history (100 top-level messages)
3. **NEW: Find relevant threads from channel history**
4. Classify request (with enriched context)
5. Generate response (with enriched context)
```

**Code changes in `handleNewAppMention()`:**
```typescript
// After getting channel history
const channelHistory = await getChannelHistory(channel, botUserId, 100);

// NEW: Find relevant threads
const relevantContext = await findRelevantThreads({
  channel,
  userPrompt: event.text,
  botUserId,
  channelHistory
});

// Pass enriched context to classification
const classification = await classifyRequest(messages, relevantContext);
```

### 4. Update classification and response generation

**Update `classifyRequest()` signature:**
```typescript
export const classifyRequest = async (
  messages: ModelMessage[],
  additionalContext?: string // Relevant threads
)
```

**Update system prompt to include:**
```
## Additional Context from Channel:
${additionalContext}
```

**Same for `generateResponse()`**

### 5. Optimization: Caching and rate limiting

**Add simple in-memory cache:**
```typescript
// Cache channel history for 5 minutes per channel
const channelHistoryCache = new Map<string, {
  data: string,
  timestamp: number
}>();

// Cache thread fetches for 10 minutes
const threadCache = new Map<string, any>();
```

**Rate limiting:**
- Limit to max 10 threads per request
- Sort by relevance score, take top 10
- Add timeout (5 seconds max for thread fetching)

### 6. Error handling

**Fallback strategy:**
- If LLM relevance analysis fails → use keyword matching fallback
- If thread fetching fails → continue with just channel history
- If timeout → use partial results
- Log all failures for debugging

### 7. Configuration

**Add environment variables:**
```
MAX_RELEVANT_THREADS=10 (default)
RELEVANCE_SCORE_THRESHOLD=0.6 (default)
THREAD_FETCH_TIMEOUT_MS=5000 (default)
```

### 8. Testing approach

**Unit tests:**
- Test relevance analysis with mock messages
- Test thread fetching with mock Slack API
- Test cache behavior

**Integration test scenarios:**
- Prompt mentions team ID buried in a thread
- Multiple threads discuss same issue
- No relevant threads (should work without context)
- High-traffic channel with 50+ threads

## Performance Estimates

**Additional latency:**
- LLM relevance call: ~500-1000ms
- Fetch 3-5 threads: ~300-500ms per thread (can parallelize)
- **Total added: ~1.5-2.5 seconds**

**API calls:**
- 1 additional LLM call (relevance analysis)
- 3-10 additional Slack API calls (thread fetching)
- Well within rate limits

**Cost:**
- GPT-4o-mini for relevance: ~$0.0001 per request
- Negligible compared to main agent call

## Alternative: Two-stage LLM approach

Instead of separate relevance analyzer, could use agent's natural tool-calling:

```typescript
tools: {
  searchRelevantThreads: tool({
    description: "Search channel threads for additional context about the customer issue",
    execute: async () => {
      // Analyze and fetch
    }
  })
}
```

**Pros:** Agent decides when it needs more context
**Cons:** May not call tool when it should, adds complexity

**Recommendation:** Start with automatic preprocessing (simpler, more reliable)

## Open Questions

1. Should we still pass full channel history OR only relevant threads?
   - **Recommendation:** Pass both - channel history for overview, threads for details

2. What if the user prompt IS in a thread already?
   - **Recommendation:** Skip thread search (already have thread context)

3. Should field team see "Searching threads..." status?
   - **Recommendation:** Yes - transparency about what agent is doing

4. How to present thread context to LLM?
   - **Format:** "Thread from [timestamp]: [root message]\n  Reply: [message]\n  Reply: [message]"

## Success Metrics

After implementation:
- Agent correctly finds Team IDs mentioned in threads
- Better classification accuracy for complex discussions
- No significant latency degradation
- No rate limit issues in production
