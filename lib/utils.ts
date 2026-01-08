import Exa from "exa-js";

// Initialize Exa client only if API key is available
export const exa = process.env.EXA_API_KEY ? new Exa(process.env.EXA_API_KEY) : null;