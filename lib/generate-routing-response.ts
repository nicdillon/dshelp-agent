interface RoutingResponseOptions {
  category: string;
  suggestedTeam: string;
  reasoning: string;
}

export const generateRoutingResponse = (options: RoutingResponseOptions): string => {
  const { category, suggestedTeam, reasoning } = options;

  const teamRouting: Record<string, string> = {
    "billing-pricing": "For billing and pricing questions, please reach out to our Sales or Billing team at sales@vercel.com or through your account dashboard.",
    "contracts-legal": "For contract and legal inquiries, please contact our Legal team through your account manager or legal@vercel.com.",
    "sales-inquiry": "For sales inquiries, product demos, or enterprise discussions, please contact our Sales team at sales@vercel.com.",
    "general-support": "For general account support, please visit https://vercel.com/help or contact our Support team through your dashboard.",
    "out-of-scope": suggestedTeam
      ? `This question would be best handled by the ${suggestedTeam}. Please reach out to them for assistance.`
      : "This question is outside my area of expertise. Please contact Vercel support at https://vercel.com/help for assistance.",
  };

  const routingMessage = teamRouting[category] || teamRouting["out-of-scope"];

  return `Hi there! 👋

I'm the Developer Success AI assistant, and I specialize in helping with technical troubleshooting, best practices, and Vercel/Next.js implementation questions.

${routingMessage}

If you have questions about Vercel platform issues, Next.js development, AI SDK implementation, or need architecture guidance, I'm here to help! Feel free to ask about those topics anytime.`;
};
