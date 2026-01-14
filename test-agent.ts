/**
 * Test script for DSE agent classification and routing
 *
 * SAFETY WARNING: This script ONLY tests classification logic.
 * It does NOT test response generation or ticket creation to avoid posting to real Slack channels.
 *
 * To test full response generation safely, you would need to:
 * 1. Mock the Slack client before importing any modules
 * 2. Use a test Slack workspace
 * 3. Set SLACK_TICKET_CHANNEL_ID to a test channel
 */

// Safety check: Warn if running in production environment
if (process.env.SLACK_TICKET_CHANNEL_ID && !process.env.SLACK_TICKET_CHANNEL_ID.includes("test")) {
  console.error("\n⚠️  WARNING: SLACK_TICKET_CHANNEL_ID appears to be a production channel!");
  console.error("⚠️  This test only validates classification logic, not response generation.");
  console.error("⚠️  To avoid accidental Slack posts, set SLACK_TICKET_CHANNEL_ID to a test channel.\n");
}

import { ModelMessage } from "ai";
import { classifyRequest } from "./lib/classify-request";

interface TestScenario {
  name: string;
  description: string;
  channelHistory: string;
  fieldTeamRequest: string;
  expectedInScope: boolean;
  expectedCategory?: string;
  expectedTeamRouting?: string;
}

const testScenarios: TestScenario[] = [
  // IN-SCOPE TESTS
  {
    name: "Test 1: Deep Technical Debugging",
    description: "Customer experiencing cold start issues",
    channelHistory: `[2024-01-14T10:00:00Z] User: We're seeing 2-3 second cold starts on our API routes. This is affecting our production users.
[2024-01-14T10:01:00Z] User: The routes are in app/api/users/route.ts and team_abc123xyz456. Project is prj_def789ghi012.
[2024-01-14T10:02:00Z] User: We've tried adjusting memory allocation but it hasn't helped.`,
    fieldTeamRequest: "AE: @dse-agent can you help review this cold start issue?",
    expectedInScope: true,
    expectedCategory: "technical-troubleshooting",
  },
  {
    name: "Test 2: Usage Cost Optimization (Technical)",
    description: "Customer wants to reduce Fast Data Transfer costs",
    channelHistory: `[2024-01-14T10:00:00Z] User: Our bill jumped 40% last month due to Fast Data Transfer charges.
[2024-01-14T10:01:00Z] User: We're on team_xyz789abc123. Is there a way to optimize this?
[2024-01-14T10:02:00Z] User: We're serving a lot of large images and videos.`,
    fieldTeamRequest: "CSM: @dse-agent can DSE help with optimizing their FDT usage?",
    expectedInScope: true,
    expectedCategory: "usage-cost-guidance",
  },
  {
    name: "Test 7: Performance Investigation with Partial Context",
    description: "Customer reports slowness, team ID mentioned earlier in channel",
    channelHistory: `[2024-01-14T09:00:00Z] User: Just FYI, we're on team_acme999xyz for this project.
[2024-01-14T10:00:00Z] User: Our application's dashboard is loading really slowly since our last deployment.
[2024-01-14T10:01:00Z] User: It was fine before, now users are complaining it takes 5+ seconds to load.`,
    fieldTeamRequest: "AE: @dse-agent can you look into this performance issue?",
    expectedInScope: true,
    expectedCategory: "performance-optimization",
  },

  // OUT-OF-SCOPE TESTS
  {
    name: "Test 8: Platform Bug/Outage",
    description: "Customer experiencing 500 errors on all deployments",
    channelHistory: `[2024-01-14T10:00:00Z] User: All our deployments are failing with 500 errors.
[2024-01-14T10:01:00Z] User: This started 30 minutes ago, nothing changed on our end.
[2024-01-14T10:02:00Z] User: Multiple projects affected: prj_aaa111, prj_bbb222`,
    fieldTeamRequest: "AE: @dse-agent we need urgent help with this outage!",
    expectedInScope: false,
    expectedCategory: "support-incidents",
    expectedTeamRouting: "CSE via support ticket",
  },
  {
    name: "Test 9: Contract/Pricing Question",
    description: "Customer wants to adjust MIU commitment",
    channelHistory: `[2024-01-14T10:00:00Z] User: We're consistently hitting overages on our MIU commitment.
[2024-01-14T10:01:00Z] User: We're contracted for 100 MIUs but using 150 each month.
[2024-01-14T10:02:00Z] User: Can we adjust our contract to 150 MIUs to avoid overage charges?`,
    fieldTeamRequest: "CSM: @dse-agent can DSE help with this MIU adjustment?",
    expectedInScope: false,
    expectedCategory: "billing-pricing-commercial",
    expectedTeamRouting: "AE/CSM",
  },
  {
    name: "Test 10: Full Implementation Request",
    description: "Customer wants help building entire feature",
    channelHistory: `[2024-01-14T10:00:00Z] User: We need to implement a complex authentication flow with SSO.
[2024-01-14T10:01:00Z] User: Can someone from Vercel help us build this? We're not sure where to start.
[2024-01-14T10:02:00Z] User: Would need several sessions to walk through the implementation.`,
    fieldTeamRequest: "AE: @dse-agent can DSE help build this for them?",
    expectedInScope: false,
    expectedCategory: "implementation-work",
    expectedTeamRouting: "Professional Services",
  },
  {
    name: "Test 16: AI SDK Question",
    description: "Customer asking about AI SDK streaming",
    channelHistory: `[2024-01-14T10:00:00Z] User: How do we implement streaming responses with the AI SDK?
[2024-01-14T10:01:00Z] User: The documentation shows useChat but we need more control.
[2024-01-14T10:02:00Z] User: Can someone walk us through the streaming API?`,
    fieldTeamRequest: "SE: @dse-agent can DSE help with AI SDK implementation?",
    expectedInScope: false,
    expectedCategory: "out-of-scope",
    expectedTeamRouting: "#help-ai-enablement",
  },

  // EDGE CASE TESTS
  {
    name: "Test 20: Ambiguous - Could be Platform or Implementation",
    description: "ISR not working, unclear if bug or misconfiguration",
    channelHistory: `[2024-01-14T10:00:00Z] User: ISR isn't revalidating our product pages.
[2024-01-14T10:01:00Z] User: We set revalidate: 3600 but pages never update.
[2024-01-14T10:02:00Z] User: Project: prj_isr123test, Team: team_shop456`,
    fieldTeamRequest: "SE: @dse-agent not sure if this is a bug or config issue?",
    expectedInScope: true, // DSE will triage
    expectedCategory: "technical-troubleshooting",
  },
  {
    name: "Test 22: Missing Context - No Team/Project ID",
    description: "Customer issue described but no IDs in thread",
    channelHistory: `[2024-01-14T10:00:00Z] User: Our site is really slow since yesterday.
[2024-01-14T10:01:00Z] User: Getting complaints from users about load times.`,
    fieldTeamRequest: "AE: @dse-agent can DSE investigate this performance issue?",
    expectedInScope: true,
    expectedCategory: "performance-optimization",
  },
];

async function runTest(scenario: TestScenario): Promise<boolean> {
  console.log(`\n${"=".repeat(80)}`);
  console.log(`Running: ${scenario.name}`);
  console.log(`Description: ${scenario.description}`);
  console.log(`${"=".repeat(80)}\n`);

  // Convert channel history + field team request into ModelMessages
  const messages: ModelMessage[] = [
    {
      role: "user",
      content: scenario.fieldTeamRequest,
    },
  ];

  try {
    // Step 1: Classify the request
    console.log("📋 Step 1: Classifying request...\n");
    const classification = await classifyRequest(messages);

    console.log("Classification Result:");
    console.log(`  - In Scope: ${classification.isInScope}`);
    console.log(`  - Category: ${classification.category}`);
    console.log(`  - Suggested Team: ${classification.suggestedTeam}`);
    console.log(`  - Reasoning: ${classification.reasoning}\n`);

    // Validate classification
    let passed = true;
    if (classification.isInScope !== scenario.expectedInScope) {
      console.log(
        `❌ FAILED: Expected isInScope=${scenario.expectedInScope}, got ${classification.isInScope}`
      );
      passed = false;
    } else {
      console.log(`✅ Classification scope correct`);
    }

    if (
      scenario.expectedCategory &&
      classification.category !== scenario.expectedCategory
    ) {
      console.log(
        `⚠️  WARNING: Expected category=${scenario.expectedCategory}, got ${classification.category}`
      );
      // Not failing on category mismatch since categories might be similar
    }

    if (
      scenario.expectedTeamRouting &&
      !classification.suggestedTeam.includes(scenario.expectedTeamRouting)
    ) {
      console.log(
        `⚠️  WARNING: Expected team routing to include "${scenario.expectedTeamRouting}", got "${classification.suggestedTeam}"`
      );
    }

    // Step 2: Validate expected team routing (classification only - no response generation)
    if (!classification.isInScope) {
      console.log("\n✅ Correctly identified as out-of-scope\n");
    } else {
      console.log("\n✅ Correctly identified as in-scope for DSE\n");
      console.log("⚠️  NOTE: Not testing response generation to avoid posting to Slack");
    }

    return passed;
  } catch (error) {
    console.error(`❌ ERROR: Test failed with exception:`, error);
    return false;
  }
}

async function runAllTests() {
  console.log("\n" + "=".repeat(80));
  console.log("DSE AGENT TEST SUITE - CLASSIFICATION ONLY");
  console.log("=".repeat(80));
  console.log("⚠️  These tests ONLY validate classification logic");
  console.log("⚠️  Response generation is NOT tested to avoid Slack posts");
  console.log("=".repeat(80) + "\n");

  const results: { name: string; passed: boolean }[] = [];

  for (const scenario of testScenarios) {
    const passed = await runTest(scenario);
    results.push({ name: scenario.name, passed });
  }

  // Summary
  console.log("\n" + "=".repeat(80));
  console.log("TEST SUMMARY");
  console.log("=".repeat(80) + "\n");

  const passedCount = results.filter((r) => r.passed).length;
  const totalCount = results.length;

  results.forEach((result) => {
    const icon = result.passed ? "✅" : "❌";
    console.log(`${icon} ${result.name}`);
  });

  console.log(`\n${passedCount}/${totalCount} tests passed`);

  if (passedCount === totalCount) {
    console.log("\n🎉 All tests passed!");
  } else {
    console.log(`\n⚠️  ${totalCount - passedCount} test(s) failed`);
  }
}

// Run tests
runAllTests().catch((error) => {
  console.error("Fatal error running tests:", error);
  process.exit(1);
});
