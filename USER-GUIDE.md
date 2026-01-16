# DSE Slack Agent - User Guide for Field Engineering

## What is the DSE Slack Agent?

The DSE Slack Agent (`@Dev Success Support Agent`) is an AI-powered bot that helps field team members (AEs, CSMs, SEs) triage customer issues and determine if they should be routed to the Developer Success Engineering (DSE) team.

**Key Benefits:**
- 🎯 Automatic triage and routing guidance
- 📝 Automated ticket creation with context from channel history
- ⚡ Faster response times for DSE engagement
- 🔍 Smart context gathering (Team IDs, Project IDs, customer details)

---

## How to Use the Agent

### Basic Usage

Simply **@mention the agent** in any Slack channel or thread:

```
@Dev Success Support Agent [your request]
```

**Examples:**
- `@Dev Success Support Agent please create a ticket for the DSE team to investigate this cold start issue`
- `@Dev Success Support Agent can DSE help with this ISR cache problem?`
- `@Dev Success Support Agent what types of issues can the DSE team help with?`

### Important Notes

✅ **Your responses are private** - Only you can see the agent's reply (ephemeral messages)

✅ **DSE tickets are public** - When a ticket is created, it's posted to the DSE team channel for everyone to see

✅ **Agent searches channel history** - It automatically looks for Team IDs, Project IDs, and customer context in recent messages

---

## When to Use the Agent

### ✅ Use the agent when:

1. **You need to engage DSE** for a customer issue
   - Technical debugging (cold starts, caching, ISR, routing issues)
   - Performance investigations
   - Usage/cost optimization guidance
   - Onboarding or enablement sessions

2. **You're unsure if an issue is in DSE scope**
   - The agent will classify and provide routing guidance

3. **You need to document ongoing DSE work**
   - "Track this work DSE is doing with customer X"

4. **You have questions about DSE capabilities**
   - "What can DSE help with?"
   - "When should I engage the DSE team?"

### ❌ Don't use the agent for:

- Urgent production outages (ping DSE team directly in #help-dev-success)
- Internal DSE team discussions
- Non-customer-facing issues

---

## What to Expect

### If Your Request is IN-SCOPE for DSE:

**The agent will:**
1. ✅ Analyze the request and channel history
2. 🔍 Search for Team IDs, Project IDs, and customer context
3. 🎫 **Automatically create a DSE ticket** with:
   - Customer name and Team ID
   - Concise issue title (e.g., "Investigate Fluid Compute session overlap")
   - Issue summary with context
   - Priority level (SEV 1/2/3)
   - Link back to the Slack thread
4. ✉️ Confirm ticket creation to you (ephemeral message)

**You'll see:**
```
✅ DSE ticket created successfully! Posted to DSE team channel with:
- Customer: Acme Corp
- Team ID: team_abc123xyz
- Priority: 🟡 SEV 3/Non-Urgent

DSE team will investigate and provide guidance.
```

### If Your Request is OUT-OF-SCOPE:

**The agent will:**
1. ✅ Explain what DSE handles
2. 🔀 Provide specific routing guidance
3. 📋 Tell you which team should handle this

**You'll see:**
```
I've reviewed the customer issue in this channel. This request is OUT OF DSE SCOPE.

DSE handles:
• Deep technical debugging & performance investigations
• Usage, cost, and efficiency guidance
• Onboarding, enablement, and go-live support

Classification:
This appears to be a billing/contract issue.

Routing recommendation:
Route to: AE/CSM + FinOps/Deal Desk
[explanation of why and next steps]
```

### If It's an Informational Question:

**You'll see:**
```
The DSE team can help with:

• Time-boxed onboarding & enablement
  - Structured onboarding sessions for Vercel features
  - Go-live support and hypercare

• Deep technical debugging & performance
  - Cold starts, caching, ISR, routing investigations
  - Reproducing issues and recommending fixes

[etc.]
```

---

## Example Scenarios

### Scenario 1: Technical Investigation (IN-SCOPE)

**Your message:**
```
@Dev Success Support Agent please create a ticket to investigate the
revalidatePath issue we discussed. Customer is seeing cache not clearing
despite webhook firing correctly. This is blocking their production deployment.
```

**Expected result:**
- ✅ Classified as IN-SCOPE (technical-troubleshooting)
- 🎫 Ticket created with title: "Investigate revalidatePath cache clearing issue"
- 🔴 Priority: SEV 2/High (production blocked)
- 📝 Summary includes context from channel history

---

### Scenario 2: Usage/Cost Guidance (IN-SCOPE)

**Your message:**
```
@Dev Success Support Agent can DSE help review why our customer's
ISR write units spiked after they upgraded to Next.js 15?
```

**Expected result:**
- ✅ Classified as IN-SCOPE (usage-cost-guidance)
- 🎫 Ticket created with title: "ISR write units spike after Next.js 15 upgrade"
- 🟡 Priority: SEV 3/Non-Urgent
- 📝 Summary includes framework upgrade details

---

### Scenario 3: Tracking Ongoing Work (IN-SCOPE)

**Your message:**
```
@Dev Success Support Agent Karson is already investigating this Fluid Compute
bug with the customer. Can you create a ticket to track this work?
```

**Expected result:**
- ✅ Classified as IN-SCOPE (technical-troubleshooting)
- 🎫 Ticket created with title: "Track Fluid Compute investigation"
- 📝 Summary notes: "DSE is actively investigating with customer..."

---

### Scenario 4: Platform Outage (OUT-OF-SCOPE)

**Your message:**
```
@Dev Success Support Agent customer is getting 500 errors on all deployments
```

**Expected result:**
- ❌ Classified as OUT-OF-SCOPE (clear platform issue)
- 🔀 Routing: "CSE via support ticket at vercel.com/help"
- 📋 Explanation: "This is a platform outage requiring CSE support"

---

### Scenario 5: Billing Question (OUT-OF-SCOPE)

**Your message:**
```
@Dev Success Support Agent customer wants to adjust their MIU commitment
```

**Expected result:**
- ❌ Classified as OUT-OF-SCOPE (commercial/contract)
- 🔀 Routing: "AE/CSM + FinOps/Deal Desk"
- 📋 Explanation: "Contract adjustments are handled by AE/CSM with Deal Desk"

---

### Scenario 6: Informational Question

**Your message:**
```
@Dev Success Support Agent what types of issues can DSE help with?
```

**Expected result:**
- ℹ️ Informational response (no ticket created)
- 📋 List of DSE capabilities
- 📋 Guidance on when to engage DSE

---

## Tips for Best Results

### 🎯 Provide Context

**Good:**
```
@Dev Success Support Agent please create a ticket to investigate cold starts
on the customer's Edge Functions. They're seeing 2-3 second cold starts which
is impacting their checkout flow. Team ID is team_abc123.
```

**Less ideal:**
```
@Dev Success Support Agent cold starts are slow
```

### 🧵 Use Threads When Possible

If you're discussing a customer issue in a thread, @mention the agent **in that thread** so it has full conversation context.

### 📝 Include Key Details

The agent searches channel history, but including these details helps:
- Customer/company name
- Team ID (format: `team_XXXXXXXXXXXXXXXXXXXXXXXX`)
- Project ID (format: `prj_XXXXXXXXXXXXXXXXXXXXXXXX`)
- Priority/urgency (production blocked, customer escalation, etc.)

### 🔄 Mention Ongoing Work

If DSE is already engaged, mention it:
```
@Dev Success Support Agent Jordan is already working with the customer on this.
Please create a ticket to track this investigation.
```

---

## What the Agent Does Behind the Scenes

1. **Analyzes your request** using GPT-4o to classify as in-scope or out-of-scope

2. **Searches channel history** (last ~100 messages) for:
   - Team IDs and Project IDs
   - Customer names and company information
   - Previous discussions about the same issue
   - Additional context

3. **Determines priority** based on:
   - Production impact
   - Customer escalations
   - Urgency indicators in your message

4. **Creates detailed tickets** with:
   - Concise, descriptive title
   - Customer information
   - Issue summary (not the entire conversation)
   - Priority level
   - Link back to Slack thread

5. **Posts to DSE team channel** (#help-dev-success or configured channel)

---

## Providing Feedback

### If something doesn't work as expected:

**Option 1: Slack DM**
Send a direct message to **Nic Dillon** with:
- Screenshot of your request
- Screenshot of the agent's response
- What you expected vs. what happened

**Option 2: GitHub Issues**
Report issues at: https://github.com/nicdillon/dshelp-agent/issues

Please include:
- Your prompt to the agent
- The agent's response
- Expected behavior
- Any relevant context

**Option 3: Slack Channels**
Post in **#help-dev-success** if you need immediate DSE engagement

---

## Common Questions

### Q: Why didn't the agent create a ticket?

**A:** The agent classified your request as one of:
- OUT-OF-SCOPE (routed to another team)
- INFORMATIONAL (just asking about DSE capabilities)

Check the agent's response for routing guidance.

### Q: Can I see the ticket that was created?

**A:** Yes! The agent posts tickets to the DSE team channel. Check #help-dev-success or ask the agent to share the link.

### Q: What if the agent missed important context?

**A:** The agent searches the last ~100 channel messages. If important context is older or in a different channel, include it directly in your message to the agent.

### Q: Can I edit a ticket after it's created?

**A:** Tickets are posted as Slack messages. You can reply to the ticket thread with additional context or corrections. DSE team members will see the updates.

### Q: What if my request is urgent?

**A:** For urgent production issues:
1. Tag the issue as urgent in your message: "This is blocking production"
2. The agent will set priority to SEV 1 or SEV 2
3. Consider also pinging DSE team directly in #help-dev-success

### Q: How long does it take for DSE to respond?

**A:** Ticket creation is instant. DSE team response time depends on:
- Current team workload
- Ticket priority (SEV 1/2/3)
- Complexity of the issue

Typical response: within a few hours for SEV 3, faster for SEV 1/2.

---

## Version & Updates

**Current Version:** v1.0
**Last Updated:** January 2026
**Maintained by:** Nic Dillon

For the latest updates and documentation:
- GitHub: https://github.com/nicdillon/dshelp-agent
- Documentation: [Repository README](../README.md)

---

## Quick Reference Card

| Situation | Action | Expected Result |
|-----------|--------|-----------------|
| Customer has technical issue DSE should investigate | `@Dev Success Support Agent create ticket for [issue]` | ✅ Ticket created |
| Unsure if DSE can help | `@Dev Success Support Agent can DSE help with [issue]?` | ℹ️ Routing guidance |
| Need to track ongoing DSE work | `@Dev Success Support Agent track this work` | ✅ Ticket created |
| Want to know DSE capabilities | `@Dev Success Support Agent what can DSE help with?` | ℹ️ DSE capabilities list |
| Platform outage or billing issue | `@Dev Success Support Agent [issue]` | ❌ Routing to CSE/AE/CSM |

---

**Need help?** Contact Nic Dillon or post in #help-dev-success.
