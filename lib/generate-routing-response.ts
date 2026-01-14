interface RoutingResponseOptions {
  category: string;
  suggestedTeam: string;
  reasoning: string;
}

export const generateRoutingResponse = (options: RoutingResponseOptions): string => {
  const { category, suggestedTeam, reasoning } = options;

  const teamRouting: Record<string, string> = {
    "implementation-work": `**Route to: Professional Services (paid)**

This requires multi-hour implementation sessions or building features. DSE provides guidance and patterns, not full builds. Customer will need to purchase Professional Services hours for this work.`,

    "long-term-ownership": `**Route to: AE/CSM for Platform Architect evaluation**

Customer is requesting ongoing technical ownership. Based on their ARR and strategic importance, work with AE/CSM to determine if they qualify for Platform Architect assignment. If not, DSE can handle one-off questions but not long-term embedded support.`,

    "billing-pricing-commercial": `**Route to: AE/CSM (+ FinOps/Deal Desk if needed)**

This is a commercial/contract question:
• Contract adjustments, MIU commitments → AE/CSM + FinOps/Deal Desk
• Enterprise billing questions → AE/CSM
• Invoice/payment issues → AE/CSM + FinOps/Billing Ops

Note: Technical usage optimization (how to reduce costs) IS DSE scope.`,

    "third-party-systems": `**Route to: Third-party vendor support (+ Professional Services if implementation needed)**

This is tool-specific to the third-party system. Customer should contact the vendor's support. If they need implementation help integrating with Vercel, Professional Services (paid) can assist. DSE can advise if the issue is primarily Next.js/Vercel related.`,

    "support-incidents": `**Route to: CSE via support ticket**

This appears to be a platform bug or incident. Customer should create a support ticket at **vercel.com/help**. If customer is struggling, you can create a ticket via \`/support\` command in Slack. CSE will triage and investigate.`,

    "general-support": `**Route to: CSE via support ticket or appropriate team**

Customer should create a support ticket at **vercel.com/help** for platform issues. For account management issues, route to AE/CSM who can engage Account EPD (#help-accounts).`,

    "out-of-scope": suggestedTeam
      ? `**Route to: ${suggestedTeam}**`
      : "**Route to: AE/CSM or appropriate team based on issue type**",
  };

  const routingMessage = teamRouting[category] || teamRouting["out-of-scope"];

  return `I've reviewed the customer issue in this channel. This request is **OUT OF DSE SCOPE**.

**DSE handles:**
• Deep technical debugging & performance investigations
• Usage, cost, and efficiency guidance (technical optimization)
• Onboarding, enablement, and go-live support
• Product & feature guidance
• One-off technical design reviews

**Classification:**
${reasoning}

**Routing recommendation:**
${routingMessage}`;
};
