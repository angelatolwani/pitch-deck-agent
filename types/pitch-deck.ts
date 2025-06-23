export interface PitchDeckSlide {
  slideNumber: number;
  title: string;
  content: string;
  keyPoints?: string[];
}

export interface PitchDeck {
  companyName: string;
  slides: PitchDeckSlide[];
  createdAt: string;
}

export interface StartupIdea {
  problem: string;
  solution: string;
  targetMarket: string;
  businessModel: string;
  competitiveAdvantage: string;
  team?: string;
  traction?: string;
  fundingAsk?: string;
}

export interface PitchDeckAnalysis {
  strengths: string[];
  weaknesses: string[];
  suggestions: string[];
  startupPrinciples: string[];
}

export interface ConversationState {
  questionsAsked: number;
  maxQuestions: number;
  topicsCovered: {
    problem: boolean;
    solution: boolean;
    market: boolean;
    businessModel: boolean;
    competitiveAdvantage: boolean;
    team: boolean;
    traction: boolean;
    fundingAsk: boolean;
  };
  userResponses: {
    problem?: string;
    solution?: string;
    market?: string;
    businessModel?: string;
    competitiveAdvantage?: string;
    team?: string;
    traction?: string;
    fundingAsk?: string;
  };
  areasNeedingRefinement: string[];
}

export interface RefinementArea {
  topic: string;
  currentUnderstanding: string;
  suggestedQuestions: string[];
  priority: 'high' | 'medium' | 'low';
} 