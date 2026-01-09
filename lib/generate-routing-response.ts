interface RoutingResponseOptions {
  category: string;
  suggestedTeam: string;
  reasoning: string;
}

export const generateRoutingResponse = (options: RoutingResponseOptions): string => {
  const { category, suggestedTeam, reasoning } = options;

  const teamRouting: Record<string, string> = {
    "implementation-work": `For full implementation or delivery work, I recommend connecting with **Professional Services** or our partner network. The Developer Success team provides guidance, reviews, and patterns, but doesn't handle complete feature builds or app ownership. Your account team can help connect you with the right implementation resources.`,

    "long-term-ownership": `For long-term or embedded technical ownership, please connect with your **Platform Architect** or designated Technical Contact. The Developer Success team focuses on time-boxed, high-leverage technical acceleration rather than ongoing technical ownership.`,

    "billing-pricing-commercial": `For pricing, billing, or commercial questions, please reach out to:
• **Sales Engineering / FinOps** for pricing models and cost calculations
• **Deal Desk / Enterprise Activation** for contract changes and entitlements
• Your **Account Executive** for seat management and plan changes

You can also visit https://vercel.com/help for general billing support.`,

    "third-party-systems": `For deep work in third-party systems (like Sitecore, external CDNs/WAFs, or partner-managed infrastructure), I recommend connecting with **Professional Services** or your implementation partner. The Developer Success team's scope is limited to how those systems integrate with Vercel.`,

    "support-incidents": `For support tickets or platform incident management, please:
• Visit https://vercel.com/help to open a support ticket
• Contact your designated support channel

The Developer Success team does not own ticket queues or run platform incidents. Infrastructure and product teams handle incidents with DS providing context as needed.`,

    "general-support": `For general account support, password resets, or basic configuration help, please visit https://vercel.com/help or contact our Support team through your dashboard.`,

    "out-of-scope": suggestedTeam
      ? `This request would be best handled by **${suggestedTeam}**. Please reach out to them for assistance.`
      : "This question is outside the Developer Success team's scope. Please contact your account team or visit https://vercel.com/help for assistance.",
  };

  const routingMessage = teamRouting[category] || teamRouting["out-of-scope"];

  return `Hi there! 👋

I'm the Developer Success AI assistant. I specialize in time-boxed technical acceleration including:
• Deep technical debugging & performance investigations
• Usage, cost, and efficiency guidance
• Onboarding, enablement, and go-live support
• Product & feature guidance
• AI SDK implementation help

**Why I'm re-routing your request:**
${reasoning}

**Where to go instead:**
${routingMessage}

If you have questions about technical troubleshooting, performance optimization, or Vercel/Next.js best practices, I'm here to help!`;
};
