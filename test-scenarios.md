# DSE Agent Test Scenarios

These test scenarios validate the agent's ability to triage requests from field team members (AE/CSM/SE) and route appropriately to DSE team or other teams.

## Test Structure
Each test includes:
- **Scenario**: Description of the customer issue
- **Channel History**: Simulated customer conversation
- **Field Team Request**: How AE/CSM/SE engages the agent
- **Expected Behavior**: What the agent should do

---

## IN-SCOPE TESTS (Should create DSE ticket)

### Test 1: Deep Technical Debugging
**Scenario**: Customer experiencing cold start issues

**Channel History**:
```
Customer: We're seeing 2-3 second cold starts on our API routes. This is affecting our production users.
Customer: The routes are in app/api/users/route.ts and team_abc123xyz456. Project is prj_def789ghi012.
Customer: We've tried adjusting memory allocation but it hasn't helped.
```

**Field Team Request**:
```
AE: @dse-agent can you help review this cold start issue?
```

**Expected Behavior**:
- ✅ Classify as IN-SCOPE (technical-troubleshooting)
- ✅ Create DSE ticket with:
  - Customer context from thread
  - Team ID: team_abc123xyz456
  - Project ID: prj_def789ghi012
  - Issue: Cold start performance investigation
  - Priority: SEV 2 (production impact)
- ✅ Confirm ticket created and set expectations for DSE investigation

---

### Test 2: Usage Cost Optimization (Technical)
**Scenario**: Customer wants to reduce Fast Data Transfer costs

**Channel History**:
```
Customer: Our bill jumped 40% last month due to Fast Data Transfer charges.
Customer: We're on team_xyz789abc123. Is there a way to optimize this?
Customer: We're serving a lot of large images and videos.
```

**Field Team Request**:
```
CSM: @dse-agent can DSE help with optimizing their FDT usage?
```

**Expected Behavior**:
- ✅ Classify as IN-SCOPE (usage-cost-guidance)
- ✅ Create DSE ticket for technical optimization guidance
- ✅ Extract Team ID from history
- ✅ Note that this is technical optimization (caching, image optimization strategies)

---

### Test 3: Product Feature Guidance
**Scenario**: Customer asking how to use Skew Protection

**Channel History**:
```
Customer: We're launching a new version tomorrow and want to use Skew Protection.
Customer: How do we configure this for our Next.js app on team_company123?
Customer: We need to ensure users don't get mixed versions during the deployment.
```

**Field Team Request**:
```
SE: @dse-agent can you help explain Skew Protection setup?
```

**Expected Behavior**:
- ✅ Classify as IN-SCOPE (product-feature-guidance)
- ✅ Create DSE ticket for feature guidance
- ✅ Note time sensitivity (launching tomorrow)
- ✅ Priority: SEV 2 (time-sensitive)

---

### Test 4: Onboarding Session Request
**Scenario**: High-ARR customer wants structured onboarding

**Channel History**:
```
Customer: We're migrating from AWS and need help understanding Vercel best practices.
Customer: Can we schedule onboarding sessions? We're on Enterprise plan.
AE: This is a $250k ARR account, FYI
```

**Field Team Request**:
```
AE: @dse-agent can DSE help with onboarding sessions?
```

**Expected Behavior**:
- ✅ Classify as IN-SCOPE (onboarding-enablement)
- ✅ Create DSE ticket
- ✅ Note Enterprise + high ARR = eligible for multi-session onboarding
- ✅ Priority: SEV 3 (not urgent but strategic)

---

### Test 5: One-off Technical Design Review
**Scenario**: Customer wants caching strategy reviewed

**Channel History**:
```
Customer: We implemented ISR for our product pages but not sure if we're doing it optimally.
Customer: Can someone review our caching approach? Project: prj_cache123test
Customer: We're seeing some stale data issues.
```

**Field Team Request**:
```
CSM: @dse-agent can DSE review their caching implementation?
```

**Expected Behavior**:
- ✅ Classify as IN-SCOPE (performance-optimization or product-feature-guidance)
- ✅ Create DSE ticket for design pattern review
- ✅ Extract Project ID
- ✅ Note specific issue: stale data with ISR

---

### Test 6: Next.js Implementation Question
**Scenario**: Customer struggling with Next.js routing on Vercel

**Channel History**:
```
Customer: Our dynamic routes aren't working as expected on Vercel.
Customer: Works fine locally but [slug] pages return 404 in production.
Customer: Team: team_nextjs456, Project: prj_routes789
```

**Field Team Request**:
```
SE: @dse-agent is this something DSE can help with?
```

**Expected Behavior**:
- ✅ Classify as IN-SCOPE (could be platform issue or implementation guidance)
- ✅ Create DSE ticket
- ✅ DSE will triage if platform bug → CSE, or implementation → DSE handles

---

### Test 7: Performance Investigation with Partial Context
**Scenario**: Customer reports slowness, team ID mentioned earlier in channel

**Channel History**:
```
[Earlier in channel]
Customer: Just FYI, we're on team_acme999xyz for this project.

[Later messages]
Customer: Our application's dashboard is loading really slowly since our last deployment.
Customer: It was fine before, now users are complaining it takes 5+ seconds to load.
```

**Field Team Request**:
```
AE: @dse-agent can you look into this performance issue?
```

**Expected Behavior**:
- ✅ Classify as IN-SCOPE (performance-optimization)
- ✅ Search channel history for Team ID
- ✅ Find team_acme999xyz from earlier message
- ✅ Create DSE ticket with full context including Team ID
- ✅ Note the regression (was fine before, broke after deployment)

---

## OUT-OF-SCOPE TESTS (Should route to other teams)

### Test 8: Platform Bug/Outage
**Scenario**: Customer experiencing 500 errors on all deployments

**Channel History**:
```
Customer: All our deployments are failing with 500 errors.
Customer: This started 30 minutes ago, nothing changed on our end.
Customer: Multiple projects affected: prj_aaa111, prj_bbb222
```

**Field Team Request**:
```
AE: @dse-agent we need urgent help with this outage!
```

**Expected Behavior**:
- ❌ OUT-OF-SCOPE (platform issue)
- ✅ Route to: **CSE via support ticket at vercel.com/help**
- ✅ Recommend AE/CSM can create ticket via `/support` in Slack if customer struggling
- ✅ Note: Suspected platform issue, CSE should triage

---

### Test 9: Contract/Pricing Question
**Scenario**: Customer wants to adjust MIU commitment

**Channel History**:
```
Customer: We're consistently hitting overages on our MIU commitment.
Customer: We're contracted for 100 MIUs but using 150 each month.
Customer: Can we adjust our contract to 150 MIUs to avoid overage charges?
```

**Field Team Request**:
```
CSM: @dse-agent can DSE help with this MIU adjustment?
```

**Expected Behavior**:
- ❌ OUT-OF-SCOPE (contract/commercial)
- ✅ Route to: **AE/CSM** (contract adjustment)
- ✅ Note: This is a contract structure question, not technical optimization

---

### Test 10: Full Implementation Request
**Scenario**: Customer wants help building entire feature

**Channel History**:
```
Customer: We need to implement a complex authentication flow with SSO.
Customer: Can someone from Vercel help us build this? We're not sure where to start.
Customer: Would need several sessions to walk through the implementation.
```

**Field Team Request**:
```
AE: @dse-agent can DSE help build this for them?
```

**Expected Behavior**:
- ❌ OUT-OF-SCOPE (implementation work)
- ✅ Route to: **Professional Services** (paid)
- ✅ Note: Multiple multi-hour implementation sessions = PS scope, not DSE

---

### Test 11: Long-term Technical Ownership Request
**Scenario**: Low-ARR customer wants dedicated technical contact

**Channel History**:
```
Customer: We'd like a dedicated technical person we can reach out to regularly.
Customer: Someone who knows our setup and can provide ongoing guidance.
AE: This is a $30k ARR Pro account
```

**Field Team Request**:
```
AE: @dse-agent can we assign a DSE to this account long-term?
```

**Expected Behavior**:
- ❌ OUT-OF-SCOPE (long-term ownership)
- ✅ Route to: **AE/CSM** to discuss if customer meets criteria for Platform Architect assignment
- ✅ Note: At $30k ARR, unlikely to qualify for PA. DSE can handle one-off questions but not ongoing ownership.

---

### Test 12: Sitecore-Specific Implementation
**Scenario**: Customer struggling with Sitecore CMS integration

**Channel History**:
```
Customer: We're getting errors from Sitecore's GraphQL API.
Customer: The Sitecore SDK documentation isn't clear on authentication.
Customer: Can someone help us implement this integration?
```

**Field Team Request**:
```
SE: @dse-agent can DSE help with Sitecore integration?
```

**Expected Behavior**:
- ❌ OUT-OF-SCOPE (third-party tool-specific issue)
- ✅ Route to: **Sitecore vendor support** (tool-specific problem)
- ✅ Note: If issue is with Next.js/Vercel integration, DSE can advise. But Sitecore API/SDK issues should go to Sitecore.
- ✅ Optional: Mention **Professional Services** if they need full implementation help

---

### Test 13: Billing Question (Contract-related)
**Scenario**: Enterprise customer confused about invoice

**Channel History**:
```
Customer: Our invoice shows charges we don't recognize.
Customer: We thought our Enterprise plan included unlimited builds?
Customer: Can someone explain these line items?
```

**Field Team Request**:
```
CSM: @dse-agent can you help explain their invoice?
```

**Expected Behavior**:
- ❌ OUT-OF-SCOPE (Enterprise billing)
- ✅ Route to: **AE/CSM** (consult account team for Enterprise billing)
- ✅ May need: **FinOps/Deal Desk** if contract clarification needed
- ✅ Note: Enterprise billing questions are account team scope, not DSE

---

### Test 14: Security Questionnaire
**Scenario**: Customer needs security questionnaire filled out

**Channel History**:
```
Customer: Our procurement team needs a security questionnaire completed.
Customer: It's about SOC 2, penetration testing, and DDOS protection.
Customer: Can you fill this out for us?
```

**Field Team Request**:
```
AE: @dse-agent can DSE help with this security questionnaire?
```

**Expected Behavior**:
- ❌ OUT-OF-SCOPE (security/compliance)
- ✅ Route to: **AE/CSM** coordinates with **Security/Customer Diligence team** (#help-customer-diligence-questions)
- ✅ Note: Security questionnaires handled by Security team, not DSE

---

### Test 15: Account Management Issue
**Scenario**: Customer can't add team members

**Channel History**:
```
Customer: We're trying to add new team members but getting an error.
Customer: "Unable to add user to team_locked123"
Customer: Is this a permissions issue?
```

**Field Team Request**:
```
CSM: @dse-agent can DSE help with this account issue?
```

**Expected Behavior**:
- ❌ OUT-OF-SCOPE (account management)
- ✅ Route to: **AE/CSM routes to #help-accounts** (Account EPD team)
- ✅ Note: If suspected platform bug, create support ticket. Otherwise Account EPD handles.

---

### Test 16: AI SDK Question
**Scenario**: Customer asking about AI SDK streaming

**Channel History**:
```
Customer: How do we implement streaming responses with the AI SDK?
Customer: The documentation shows useChat but we need more control.
Customer: Can someone walk us through the streaming API?
```

**Field Team Request**:
```
SE: @dse-agent can DSE help with AI SDK implementation?
```

**Expected Behavior**:
- ❌ OUT-OF-SCOPE (AI SDK removed from DSE scope)
- ✅ Route to: **#help-ai-enablement in Slack**
- ✅ Note: AI SDK questions go to AI enablement team

---

### Test 17: v0 Usage Question
**Scenario**: Customer asking how to use v0 feature

**Channel History**:
```
Customer: Can v0 generate TypeScript interfaces from my schema?
Customer: How do I customize the v0 output for our design system?
```

**Field Team Request**:
```
AE: @dse-agent can you help with v0 questions?
```

**Expected Behavior**:
- ❌ OUT-OF-SCOPE (v0 usage)
- ✅ Route to: **#v0-customer-help in Slack**
- ✅ Note: v0 bugs go to feedback form; v0 billing goes to CSE; v0 usage goes to #v0-customer-help

---

### Test 18: Professional Services Training Request (Low-ARR)
**Scenario**: Pro customer wants multiple training sessions

**Channel History**:
```
Customer: We're new to Next.js and Vercel.
Customer: Can we schedule 4-5 training sessions over the next month?
Customer: We need hands-on guidance for our team.
AE: This is a $15k Pro account
```

**Field Team Request**:
```
AE: @dse-agent can DSE provide these training sessions?
```

**Expected Behavior**:
- ❌ OUT-OF-SCOPE (prolonged training for low-ARR)
- ✅ Route to: **Professional Services** (paid training)
- ✅ Note: DSE can offer ONE enablement session. Multiple sessions require Professional Services purchase.
- ✅ One-off questions still welcome after enablement

---

### Test 19: Sales/Expansion Inquiry
**Scenario**: Field team asking DSE for sales help

**Channel History**:
```
AE: Customer is interested in upgrading to Enterprise.
AE: They want to know what's included and pricing.
```

**Field Team Request**:
```
AE: @dse-agent can DSE help explain Enterprise benefits?
```

**Expected Behavior**:
- ❌ OUT-OF-SCOPE (sales inquiry)
- ✅ Route to: **AE/CSM/Sales** (commercial/sales scope)
- ✅ Note: DSE doesn't handle sales, pricing, or expansion inquiries

---

## EDGE CASE TESTS

### Test 20: Ambiguous - Could be Platform or Implementation
**Scenario**: ISR not working, unclear if bug or misconfiguration

**Channel History**:
```
Customer: ISR isn't revalidating our product pages.
Customer: We set revalidate: 3600 but pages never update.
Customer: Project: prj_isr123test, Team: team_shop456
```

**Field Team Request**:
```
SE: @dse-agent not sure if this is a bug or config issue?
```

**Expected Behavior**:
- ✅ Classify as IN-SCOPE (DSE will triage)
- ✅ Create DSE ticket
- ✅ DSE investigates:
  - If platform bug → DSE routes to CSE
  - If misconfiguration → DSE provides guidance

---

### Test 21: Multiple Issues in Thread
**Scenario**: Thread contains both in-scope and out-of-scope issues

**Channel History**:
```
Customer: We're having cold start issues (issue 1)
Customer: Also our invoice seems wrong (issue 2)
Customer: And we want to add more team members but getting errors (issue 3)
Customer: Team: team_multi789
```

**Field Team Request**:
```
CSM: @dse-agent can you help triage all these issues?
```

**Expected Behavior**:
- ✅ Identify multiple distinct issues:
  1. Cold starts → IN-SCOPE (create DSE ticket)
  2. Invoice → OUT-OF-SCOPE (route to AE/CSM + FinOps)
  3. Team member errors → OUT-OF-SCOPE (route to #help-accounts)
- ✅ Create DSE ticket for cold starts
- ✅ Provide routing guidance for other issues

---

### Test 22: Missing Context - No Team/Project ID
**Scenario**: Customer issue described but no IDs in thread

**Channel History**:
```
Customer: Our site is really slow since yesterday.
Customer: Getting complaints from users about load times.
```

**Field Team Request**:
```
AE: @dse-agent can DSE investigate this performance issue?
```

**Expected Behavior**:
- ✅ Classify as IN-SCOPE (performance investigation)
- ✅ Search channel history for Team/Project IDs (none found)
- ✅ Create DSE ticket with available context
- ✅ Note in ticket: Team/Project ID not provided, DSE will need to gather
- ✅ Suggest AE provide IDs if available

---

### Test 23: Already Engaged DSE
**Scenario**: DSE already working with customer, now need limits increase

**Channel History**:
```
DSE Team Member: I've been investigating the cold start issues.
DSE Team Member: Looks like they need a concurrency limit increase.
Customer: Yes, that would help!
```

**Field Team Request**:
```
AE: @dse-agent should we create a support ticket for the limits increase?
```

**Expected Behavior**:
- ✅ Recognize DSE already engaged
- ✅ Note: Since DSE is already working with customer, DSE can coordinate the limits increase
- ✅ No need to create new ticket or route to CSE
- ✅ DSE handles coordination with Engineering/Product

---

### Test 24: Suspected Account Compromise
**Scenario**: Unauthorized activity on account

**Channel History**:
```
Customer: We're seeing deployments we didn't trigger.
Customer: Suspicious activity on team_suspect123
Customer: Think our account might be compromised.
```

**Field Team Request**:
```
CSM: @dse-agent is this a security issue DSE handles?
```

**Expected Behavior**:
- ❌ OUT-OF-SCOPE (security incident)
- ✅ Route to: **AE/CSM routes to #help-accounts** (Account EPD team)
- ✅ Note: Suspected compromise is account security issue, not DSE scope

---

### Test 25: Optimization + Limits Increase
**Scenario**: Customer needs both optimization guidance AND limits increase

**Channel History**:
```
Customer: We're hitting rate limits and also seeing slow performance.
Customer: Need to increase our limits but also want to optimize our setup.
Customer: Team: team_optimize555, Project: prj_perf666
```

**Field Team Request**:
```
SE: @dse-agent can DSE help with both the optimization and limits?
```

**Expected Behavior**:
- ✅ Classify as IN-SCOPE (performance optimization + limits coordination)
- ✅ Create DSE ticket covering both:
  - Technical optimization guidance
  - Coordination with CSE/Engineering for limits increase
- ✅ DSE handles holistically since both are part of performance engagement

---

## Test Summary
- **In-scope tests**: 7 (should create DSE tickets)
- **Out-of-scope tests**: 12 (should route to other teams)
- **Edge case tests**: 6 (complex scenarios)
- **Total tests**: 25

These tests validate:
- ✅ Correct classification of in-scope vs out-of-scope
- ✅ Channel history parsing for context extraction
- ✅ Team ID / Project ID extraction from history
- ✅ Appropriate routing to correct teams
- ✅ Ticket creation with full context
- ✅ Handling ambiguous/edge cases
- ✅ Internal field team interface (not customer-facing)
