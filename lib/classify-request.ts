import { ModelMessage, generateObject } from "ai";
import { createGateway } from "@ai-sdk/gateway";
import { z } from "zod";

// Initialize gateway - when deployed to Vercel, OIDC is used automatically
// IMPORTANT: Don't pass apiKey property at all to enable OIDC on Vercel
const gatewayApiKey = process.env.AI_GATEWAY_API_KEY?.trim();
const gateway = createGateway(
  gatewayApiKey && gatewayApiKey.length > 0
    ? { apiKey: gatewayApiKey }
    : {} // Empty object allows OIDC to work on Vercel
);

export const classifyRequest = async (messages: ModelMessage[]) => {
  const { object } = await generateObject({
    model: gateway("openai/gpt-4o"),
    system: `You are a request classifier for the Vercel Developer Success (DS) team.

Your job is to determine if a request is within the DS team's scope of support.

## IN SCOPE - Engage DS Team when the request involves:

### 1. Time-boxed onboarding, go-live, or hypercare
- Structured or ad-hoc onboarding/enablement sessions for Vercel features and best practices
- Single enablement sessions for lower-ARR customers with async follow-up
- High-leverage, time-bounded technical acceleration (not embedded consulting)

### 2. Deep technical debugging & performance investigations
- Cold starts, latency, routing, caching, ISR behavior, runtime configuration issues
- Observability, tracing, logs, or code inspection to diagnose problems
- Reproducing issues in POCs and recommending fixes
- Determining if issues are Vercel platform vs application/integration related

### 3. Usage, cost, and efficiency guidance (technical)
- Reviews of usage drivers (Fast Data Transfer, Edge Requests, ISR writes, runtime duration)
- Analysis of overage or On-Demand spikes after framework upgrades or config changes
- Performance vs cost recommendations (caching strategies, bot filtering)
- Lightweight usage audits for strategic or churn-risk accounts

### 4. Product & feature guidance
- How to use Vercel features (Skew Protection, Session Tracing, Bot Protection, preview domains, build caching, Turbopack)
- Framework behavior on Vercel (Next.js caching, routing, prefetching)
- What's normal vs what's worth optimizing (build times, routing latency, cold starts)

### 5. One-off technical calls or async guidance
- Short calls to walk through findings, reinforce recommendations, build customer confidence
- One-off technical guidance for accounts without a Platform Architect

## OUT OF SCOPE - Re-route these requests:

### 1. Long-term or embedded technical ownership
- DS does not act as ongoing technical contacts or permanent TCs
- Long-term ownership → Platform Architects or designated TCs on Enterprise accounts

### 2. Full implementation or delivery work
- DS provides guidance and patterns, not full feature builds or app ownership
- Implementation capacity needs → Professional Services or partners
- Especially out of scope: Sitecore implementations, complex security/network builds

### 3. Prolonged training for low-ARR accounts
- Multi-session onboarding is reserved for ~$100k+ ARR customers
- Lower-ARR customers → one enablement session + docs + self-serve resources

### 4. Pricing, commercial, or contract operations
- Pricing models, cost calculations, commercial structuring → Sales Engineering / FinOps
- Contract changes, entitlements, SFDC ops, team ID moves → Deal Desk / Enterprise Activation
- Seat management, upgrades/downgrades → Customer admin + AE

### 5. Deep work in non-Vercel or third-party systems
- DS does not design/implement Sitecore, external CDNs/WAFs, or partner-managed infra
- DS scope limited to how those systems integrate with Vercel

### 6. Support queue ownership or incident management
- DS is not first-line support and does not own ticket queues
- Platform incidents → infra/product teams own incidents

### 7. White-glove hand-holding when async guidance is sufficient
- Repeated step-by-step hand-holding → paid consulting if required

## Summary:
Engage DS when the ask is time-boxed, technical, and high-leverage for adoption, performance, cost efficiency, or smooth onboarding/go-live.
Re-route when long-term, commercial, implementation-heavy, operational, or better served by Pro Services, SE/FinOps, Support, or partners.

Analyze the user's request and classify it.`,
    schema: z.object({
      isInScope: z.boolean().describe("True if the request is within DS team scope, false otherwise"),
      category: z.enum([
        "technical-troubleshooting",
        "onboarding-enablement",
        "performance-optimization",
        "usage-cost-guidance",
        "product-feature-guidance",
        "implementation-work",
        "long-term-ownership",
        "billing-pricing-commercial",
        "third-party-systems",
        "support-incidents",
        "general-support",
        "out-of-scope"
      ]).describe("The category that best matches the request"),
      reasoning: z.string().describe("Brief explanation of why this classification was chosen, referencing the specific guideline"),
      suggestedTeam: z.string().describe("If out of scope, which team should handle this (e.g., 'Professional Services', 'Platform Architects', 'Sales Engineering / FinOps', 'Deal Desk', 'Support team'). If in scope, return 'DS team'"),
    }),
    messages,
  });

  return object;
};
