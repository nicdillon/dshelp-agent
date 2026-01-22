# DSE Slack Agent - Detailed Guide

This guide provides detailed examples, scenarios, and in-depth explanations for teams who want to understand exactly how the DSE Slack Agent works.

**For quick reference, see [USER-GUIDE.md](./USER-GUIDE.md)**

---

## Table of Contents

1. [Example Scenarios](#example-scenarios)
2. [What the Agent Does Behind the Scenes](#what-the-agent-does-behind-the-scenes)
3. [Detailed Q&A](#detailed-qa)
4. [Advanced Tips](#advanced-tips)

---

## Example Scenarios

### Scenario 1: Technical Investigation (IN-SCOPE)

**Your message:**
```
@Dev Success Support Agent please create a ticket to investigate the
revalidatePath issue we discussed. Customer is seeing cache not clearing
despite webhook firing correctly. This is blocking their production deployment.
```

**What happens:**
1. Agent analyzes your request and searches channel history
2. Classifies as IN-SCOPE (technical-troubleshooting)
3. Searches for Team ID, customer name in channel history
4. Creates ticket with:
   - Title: "Investigate revalidatePath cache clearing issue"
   - Priority: SEV 2/High (production blocked)
   - Summary includes context from channel history
5. Posts ticket to DSE team channel

**You see (ephemeral):**
```
DSE ticket created successfully! Posted to DSE team channel with:
- Customer: Acme Corp
- Team ID: team_abc123xyz
- Priority: SEV 2/High

DSE team will investigate and provide guidance.
```

---

### Scenario 2: Usage/Cost Guidance (IN-SCOPE)

**Your message:**
```
@Dev Success Support Agent can DSE help review why our customer's
ISR write units spiked after they upgraded to Next.js 15?
```

**What happens:**
1. Agent classifies as IN-SCOPE (usage-cost-guidance)
2. Creates ticket with:
   - Title: "ISR write units spike after Next.js 15 upgrade"
   - Priority: SEV 3/Non-Urgent
   - Summary includes framework upgrade details

**You see (ephemeral):**
```
DSE ticket created successfully! Posted to DSE team channel with:
- Customer: [Customer Name]
- Team ID: team_[found in history or unknown]
- Priority: SEV 3/Non-Urgent

DSE team will investigate and provide guidance.
```

---

### Scenario 3: Tracking Ongoing Work (IN-SCOPE)

**Your message:**
```
@Dev Success Support Agent Karson is already investigating this Fluid Compute
bug with the customer. Can you create a ticket to track this work?
```

**What happens:**
1. Agent recognizes this is tracking ongoing DSE work
2. Classifies as IN-SCOPE (technical-troubleshooting)
3. Creates ticket with:
   - Title: "Track Fluid Compute session overlap investigation"
   - Summary notes: "DSE is actively investigating with customer. Created reproduction and coordinating with CDN/Next.js teams."

**You see (ephemeral):**
```
DSE ticket created successfully! This will help track the ongoing work.
- Customer: [Customer Name]
- Team ID: team_abc123
- Priority: SEV 3/Non-Urgent

DSE team will continue their investigation.
```

**Key insight:** The state of work (not started, in progress, completed) doesn't matter. If the TYPE of work is in DSE scope, tracking it is valid.

---

### Scenario 4: Platform Outage (OUT-OF-SCOPE)

**Your message:**
```
@Dev Success Support Agent customer is getting 500 errors on all deployments
```

**What happens:**
1. Agent classifies as OUT-OF-SCOPE (clear platform issue)
2. NO ticket created
3. Provides routing guidance

**You see (ephemeral):**
```
I've reviewed the customer issue. This request is OUT OF DSE SCOPE.

DSE handles:
• Deep technical debugging & performance investigations
• Usage, cost, and efficiency guidance
• Onboarding, enablement, and go-live support

Classification:
This appears to be a clear platform issue (deployment failures, 500 errors).

Routing recommendation:
Route to: CSE (Customer Success Engineering) via support ticket

The customer should create a support ticket at vercel.com/help. If the
customer is struggling, you can create a ticket via /support command in Slack.
CSE will triage platform issues and outages.
```

---

### Scenario 5: Billing Question (OUT-OF-SCOPE)

**Your message:**
```
@Dev Success Support Agent customer wants to adjust their MIU commitment
```

**What happens:**
1. Agent classifies as OUT-OF-SCOPE (commercial/contract)
2. NO ticket created
3. Provides routing guidance

**You see (ephemeral):**
```
I've reviewed this request. This is OUT OF DSE SCOPE.

DSE handles:
• Technical debugging and performance investigations
• Usage/cost optimization (technical)
• Onboarding and enablement

Classification:
This is a billing/commercial question.

Routing recommendation:
Route to: AE/CSM + FinOps/Deal Desk

Contract adjustments, MIU commitments, and pricing structure are handled
by the AE/CSM who may involve Deal Desk or FinOps. For technical usage
optimization (how to reduce costs), DSE can help.
```

---

### Scenario 6: Informational Question

**Your message:**
```
@Dev Success Support Agent what types of issues can DSE help with?
```

**What happens:**
1. Agent recognizes this as informational (not a customer issue)
2. NO ticket created
3. Provides helpful answer

**You see (ephemeral):**
```
The DSE team can help with:

Time-boxed onboarding & enablement:
- Structured onboarding sessions for Vercel features and best practices
- Go-live support and hypercare for critical launches

Deep technical debugging & performance:
- Investigating cold starts, latency, routing, caching, ISR behavior
- Using observability, tracing, and logs to diagnose issues
- Reproducing problems and recommending fixes

Usage, cost, and efficiency guidance:
- Analyzing usage drivers (Fast Data Transfer, Edge Requests, ISR writes)
- Investigating overage spikes after framework upgrades
- Performance vs cost optimization recommendations

Product & feature guidance:
- How to use Vercel features (Skew Protection, Bot Protection, etc.)
- Framework behavior on Vercel (Next.js caching, routing, prefetching)

One-off technical guidance:
- Design pattern reviews
- Architecture feedback
- Challenging Next.js/Vercel bugs
```

---

## What the Agent Does Behind the Scenes

### Step 1: Classification (2-3 seconds)

The agent uses GPT-4o to analyze your request and classify it:

**Analyzes:**
- Is this a customer issue requiring DSE investigation?
- Is this tracking ongoing DSE work?
- Is this an informational question about DSE?
- Or is this out-of-scope (platform bug, billing, etc.)?

**Output:**
- `isInScope: true/false`
- `category: technical-troubleshooting | usage-cost-guidance | ...`
- `suggestedTeam: DSE team | CSE | AE/CSM | ...`
- `reasoning: Brief explanation`

### Step 2: Channel History Search (if creating ticket)

The agent searches the last ~100 channel messages for:

**Team IDs:**
- Pattern: `team_XXXXXXXXXXXXXXXXXXXXXXXX`
- Extracts all unique Team IDs found

**Project IDs:**
- Pattern: `prj_XXXXXXXXXXXXXXXXXXXXXXXX`
- Extracts all unique Project IDs found

**Customer context:**
- Customer names, company names
- Previous discussions about the same issue
- Any additional relevant context

**Search is performed via the `searchChannelHistory` tool:**
```javascript
// Example: Agent searches for "team ID"
searchChannelHistory({ searchQuery: "team ID" })
// Returns: team_abc123xyz found in message from 2 hours ago
```

### Step 3: Priority Determination

**SEV 1 / Urgent:**
- Production is down or completely blocked
- Critical customer escalation
- Keywords: "production down", "blocking launch", "urgent", "escalation"

**SEV 2 / High:**
- Production impacted but not completely down
- Customer blocked on important feature
- Keywords: "blocking production deployment", "can't ship", "customer blocked"

**SEV 3 / Non-Urgent (default):**
- Performance optimization
- Questions or guidance
- Non-blocking issues

### Step 4: Ticket Creation

The agent calls the `createTicket` tool with:

```javascript
{
  customer: "user@company.com",
  customerName: "Acme Corp",
  customerSegment: "Enterprise",
  teamId: "team_abc123xyz",
  projectId: "prj_def456abc",
  priority: "SEV 2/High",
  elevatedPriorityContext: "Production deployment blocked",
  issueCategory: "technical-troubleshooting",
  issueTitle: "Investigate revalidatePath cache clearing issue",
  issueSummary: "Customer experiencing cache not clearing despite webhook firing correctly after revalidatePath call. Issue is blocking their production deployment. Using Next.js 15 and Contentful CMS."
}
```

### Step 5: Slack Message Posting

The ticket is posted to the DSE team channel with:

**Message format:**
- **Title:** `[issueTitle] - [customerName]`
- **Body:** Formatted blocks with customer info, Team ID, priority, issue summary, Slack thread link

**Example:**
```
Title: Investigate revalidatePath cache clearing issue - Acme Corp

Customer: user@company.com
Customer Name: Acme Corp
Customer Segment: Enterprise
Team ID: team_abc123xyz
Project ID: prj_def456abc
Priority: SEV 2/High

Context on Elevated Priority:
Production deployment blocked

Request:
Customer experiencing cache not clearing despite webhook firing correctly
after revalidatePath call. Issue is blocking their production deployment.
Using Next.js 15 and Contentful CMS.

Slack Thread: [View original conversation]

AI Classification: technical-troubleshooting
```

---

## Detailed Q&A

### Q: What if I @mention the agent in a thread vs. channel root?

**In a thread:**
- Agent sees the full thread history (up to 50 messages)
- Better context for understanding the customer issue
- Recommended approach for customer discussions

**In channel root:**
- Agent only sees the single message you sent
- Searches last ~100 channel messages for context
- Good for quick triage questions

**Recommendation:** Always @mention in the thread where the customer issue is being discussed.

---

### Q: What if multiple Team IDs are mentioned in the channel?

**The agent:**
1. Searches for all Team IDs in channel history
2. Returns all unique Team IDs found
3. Uses the most relevant one based on context
4. If unclear, uses the first one found or asks for clarification

**Best practice:** Include the Team ID directly in your message to the agent.

---

### Q: How does the agent handle missing information?

**If Team ID is missing:**
- Agent searches channel history using `searchChannelHistory` tool
- If not found, uses `team_unknown` as placeholder
- You can reply to the ticket thread with the correct Team ID

**If customer name is missing:**
- Agent searches channel history for company names
- If not found, uses a generic identifier from the conversation
- You can reply to the ticket thread with corrections

**If priority is unclear:**
- Defaults to SEV 3/Non-Urgent
- Unless keywords like "production", "blocked", "urgent" are detected

---

### Q: Can I edit or delete a ticket after it's created?

**You cannot edit the original ticket message** (it's posted by the bot).

**But you can:**
- Reply to the ticket thread with corrections or additional context
- DSE team will see your updates
- If you need to delete a test ticket, ask Nic Dillon or a DSE team admin

---

### Q: What if the agent misclassifies my request?

**Short-term:**
1. Reply with feedback: "This should be in-scope because..."
2. If urgent, post directly in #help-dev-success
3. Send Nic Dillon a DM with the details

**Long-term:**
- Your feedback helps train the agent
- Misclassifications are tracked and used to improve the classification prompt
- Agent learns over time from feedback

---

### Q: Does the agent work in DMs?

**Currently:** The agent is designed for channel-based triage where multiple team members collaborate.

**DM support:** Not currently enabled, but could be added if there's a use case.

---

### Q: What languages does the agent support?

**Currently:** English only.

The agent's classification and routing logic is optimized for English conversations. Non-English requests may be misclassified.

---

### Q: How long does the agent take to respond?

**Typical response time:**
- Classification: 2-3 seconds
- Ticket creation: 3-5 seconds (includes channel history search)
- Total: 5-8 seconds from @mention to confirmation

**If slower:**
- Large channel history (100+ messages) may take longer to search
- High Slack API load can cause delays
- Tool execution (searchChannelHistory) adds 1-2 seconds

---

## Advanced Tips

### Tip 1: Provide Rich Context for Better Tickets

**Good:**
```
@Dev Success Support Agent please create a ticket to investigate cold starts
on the customer's Edge Functions. They're seeing 2-3 second cold starts which
is impacting their checkout flow. Team ID is team_abc123. Customer is on
Enterprise plan and this is blocking their Q4 launch.
```

**Why it's good:**
- Specific issue: "cold starts on Edge Functions"
- Impact: "impacting checkout flow"
- Urgency: "blocking Q4 launch"
- Context: Team ID, Enterprise plan
- Result: Agent creates SEV 2 ticket with full context

---

### Tip 2: Use the Agent for Pre-Call Prep

**Before a customer call:**
```
@Dev Success Support Agent can DSE help with [brief issue description]?
```

**Benefit:**
- Quick triage before committing DSE resources
- Understand if issue is in-scope
- Get routing guidance if out-of-scope

---

### Tip 3: Batch Documentation for Multiple Issues

**If tracking multiple DSE engagements:**
```
@Dev Success Support Agent please create tickets for:
1. Cold start investigation with Customer A (team_abc123)
2. ISR cache issue with Customer B (team_def456)
3. Usage spike analysis with Customer C (team_ghi789)
```

**Note:** The agent will process these sequentially. Each may require a separate @mention for best results.

---

### Tip 4: Leverage Thread Context

**In a long customer thread:**
- Don't repeat the entire discussion in your @mention
- Just say: `@Dev Success Support Agent create a ticket for this issue`
- Agent will read the full thread and extract context automatically

---

### Tip 5: Use for Routing Guidance Before Escalating

**Unsure if CSE or DSE should handle something?**
```
@Dev Success Support Agent is this DSE scope: [describe issue]
```

**Agent will:**
- Classify the issue
- Explain what DSE handles
- Provide specific routing if out-of-scope
- No ticket created (just guidance)

---

## Version & Updates

**Current Version:** v1.0
**Last Updated:** January 2026
**Maintained by:** Nic Dillon

**Recent changes:**
- Initial release with classification and ticket creation
- Channel history search for Team IDs and customer context
- Multi-step tool calling for automated ticket creation
- Ephemeral responses for privacy

**Roadmap:**
- LLM-based thread discovery (search other threads for context)
- Improved priority detection
- Integration with Linear for direct ticket creation

---

**Questions?** Contact Nic Dillon or post in #help-dev-success.
