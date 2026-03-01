// State of the agent, make sure this aligns with your agent's state.
export type AgentState = {
  proverbs: string[];
};

// --- DocuMind types ---

export type Citation = {
  index: number;
  title: string;
  uri: string;
  snippet: string;
};

export type ChatResponse = {
  response: string;
  citations: Citation[];
};
