import { Agent, Runner, tool } from "@openai/agents";
import { openai } from "@ai-sdk/openai";
import { aisdk } from "@openai/agents-extensions";
import { generateText } from "ai";
import { z } from "zod";
import { RetrievalService } from "@/lib/retrieval";
import type { PitchDeck, PitchDeckSlide, StartupIdea, PitchDeckAnalysis, ConversationState, RefinementArea } from "@/types/pitch-deck";

interface AgentMessage {
  role: "user" | "assistant";
  content: string;
}

// Global conversation state (in production, this should be stored per session)
let conversationState: ConversationState = {
  questionsAsked: 0,
  maxQuestions: 8,
  topicsCovered: {
    problem: false,
    solution: false,
    market: false,
    businessModel: false,
    competitiveAdvantage: false,
    team: false,
    traction: false,
    fundingAsk: false,
  },
  userResponses: {},
  areasNeedingRefinement: [],
};

// Function to reset conversation state (for new sessions)
function resetConversationState() {
  conversationState = {
    questionsAsked: 0,
    maxQuestions: 8,
    topicsCovered: {
      problem: false,
      solution: false,
      market: false,
      businessModel: false,
      competitiveAdvantage: false,
      team: false,
      traction: false,
      fundingAsk: false,
    },
    userResponses: {},
    areasNeedingRefinement: [],
  };
}

// Function to get all pitch deck questions at once
function getAllPitchDeckQuestions(): { question: string; topic: string; priority: 'high' | 'medium' | 'low' }[] {
  return [
    { 
      topic: 'problem', 
      question: "What specific problem are you solving? Who experiences this pain point?", 
      priority: 'high' as const 
    },
    { 
      topic: 'solution', 
      question: "How does your solution work? What makes it unique?", 
      priority: 'high' as const 
    },
    { 
      topic: 'market', 
      question: "What's your target market? How big is this opportunity? (Include numbers if possible)", 
      priority: 'high' as const 
    },
    { 
      topic: 'businessModel', 
      question: "How do you plan to make money? What's your revenue model?", 
      priority: 'medium' as const 
    },
    { 
      topic: 'competitiveAdvantage', 
      question: "What's your competitive advantage? Why can't others easily copy this?", 
      priority: 'medium' as const 
    },
    { 
      topic: 'team', 
      question: "Tell me about your team. What relevant experience do you have?", 
      priority: 'medium' as const 
    },
    { 
      topic: 'traction', 
      question: "What traction do you have so far? Users, revenue, partnerships?", 
      priority: 'low' as const 
    },
    { 
      topic: 'fundingAsk', 
      question: "How much funding are you seeking and what will you use it for?", 
      priority: 'low' as const 
    },
  ];
}

// Function to analyze comprehensive user response using OpenAI
async function analyzeComprehensiveResponse(response: string): Promise<{ extracted: Partial<StartupIdea>; topicsCovered: string[] }> {
  const extracted: Partial<StartupIdea> = {};
  const topicsCovered: string[] = [];
  
  try {
    const model = aisdk(openai("gpt-4o"));
    
    const analysisPrompt = `Analyze the following startup description and extract relevant information for a pitch deck. 
    
    User's description: "${response}"
    
    Please analyze this text and extract information for the following categories. For each category, provide the relevant text from the user's response, or indicate if it's not mentioned:
    
    1. Problem Statement - What problem are they solving and who experiences it?
    2. Solution - How does their solution work and what makes it unique?
    3. Market Opportunity - Who is their target market and how big is the opportunity?
    4. Business Model - How do they plan to make money?
    5. Competitive Advantage - What makes them unique or hard to copy?
    6. Team - Information about the founding team and their experience
    7. Traction - Current progress, users, revenue, partnerships
    8. Funding Ask - How much funding are they seeking and for what?
    
    Respond with ONLY a valid JSON object like this (no markdown formatting, no code blocks):
    {
      "problem": "extracted text or null",
      "solution": "extracted text or null", 
      "market": "extracted text or null",
      "businessModel": "extracted text or null",
      "competitiveAdvantage": "extracted text or null",
      "team": "extracted text or null",
      "traction": "extracted text or null",
      "fundingAsk": "extracted text or null",
      "topicsCovered": ["list", "of", "topics", "that", "were", "mentioned"]
    }`;

    const result = await generateText({
      model: openai("gpt-4o"),
      messages: [
        {
          role: "system",
          content: analysisPrompt,
        },
      ],
    });
    
    try {
      // Clean the response to remove markdown formatting
      let jsonText = result.text.trim();
      
      // Remove markdown code blocks if present
      if (jsonText.startsWith('```json')) {
        jsonText = jsonText.replace(/^```json\s*/, '').replace(/\s*```$/, '');
      } else if (jsonText.startsWith('```')) {
        jsonText = jsonText.replace(/^```\s*/, '').replace(/\s*```$/, '');
      }
      
      const parsed = JSON.parse(jsonText);
      
      if (parsed.problem) {
        extracted.problem = parsed.problem;
        topicsCovered.push('problem');
      }
      if (parsed.solution) {
        extracted.solution = parsed.solution;
        topicsCovered.push('solution');
      }
      if (parsed.market) {
        extracted.targetMarket = parsed.market;
        topicsCovered.push('market');
      }
      if (parsed.businessModel) {
        extracted.businessModel = parsed.businessModel;
        topicsCovered.push('businessModel');
      }
      if (parsed.competitiveAdvantage) {
        extracted.competitiveAdvantage = parsed.competitiveAdvantage;
        topicsCovered.push('competitiveAdvantage');
      }
      if (parsed.team) {
        extracted.team = parsed.team;
        topicsCovered.push('team');
      }
      if (parsed.traction) {
        extracted.traction = parsed.traction;
        topicsCovered.push('traction');
      }
      if (parsed.fundingAsk) {
        extracted.fundingAsk = parsed.fundingAsk;
        topicsCovered.push('fundingAsk');
      }
      
      // Also use the topicsCovered from AI analysis
      if (parsed.topicsCovered && Array.isArray(parsed.topicsCovered)) {
        parsed.topicsCovered.forEach((topic: string) => {
          if (!topicsCovered.includes(topic)) {
            topicsCovered.push(topic);
          }
        });
      }
      
    } catch (parseError) {
      console.warn("Failed to parse AI analysis result:", parseError);
      console.warn("Raw response:", result.text);
      // Fallback to basic extraction if JSON parsing fails
      return fallbackAnalysis(response);
    }
    
  } catch (error) {
    console.warn("AI analysis failed, using fallback:", error);
    return fallbackAnalysis(response);
  }
  
  return { extracted, topicsCovered };
}

// Fallback function for basic keyword extraction (only used if AI fails)
function fallbackAnalysis(response: string): { extracted: Partial<StartupIdea>; topicsCovered: string[] } {
  const extracted: Partial<StartupIdea> = {};
  const topicsCovered: string[] = [];
  
  const lowerResponse = response.toLowerCase();
  
  // Basic fallback detection
  if (lowerResponse.includes('problem') || lowerResponse.includes('solve') || lowerResponse.includes('pain') || 
      lowerResponse.includes('waste') || lowerResponse.includes('hunger') || lowerResponse.includes('food') ||
      lowerResponse.includes('issue') || lowerResponse.includes('challenge') || lowerResponse.includes('insecurity')) {
    extracted.problem = response;
    topicsCovered.push('problem');
  }
  
  if (lowerResponse.includes('solution') || lowerResponse.includes('platform') || lowerResponse.includes('app') || 
      lowerResponse.includes('tool') || lowerResponse.includes('connect') || lowerResponse.includes('service') ||
      lowerResponse.includes('system') || lowerResponse.includes('product') || lowerResponse.includes('win win')) {
    extracted.solution = response;
    topicsCovered.push('solution');
  }
  
  if (lowerResponse.includes('market') || lowerResponse.includes('customer') || lowerResponse.includes('user') || 
      lowerResponse.includes('billion') || lowerResponse.includes('million') || lowerResponse.includes('people') ||
      lowerResponse.includes('restaurant') || lowerResponse.includes('business') || lowerResponse.includes('industry') ||
      lowerResponse.includes('demographic') || lowerResponse.includes('audience') || lowerResponse.includes('big cities')) {
    extracted.targetMarket = response;
    topicsCovered.push('market');
  }
  
  if (lowerResponse.includes('revenue') || lowerResponse.includes('subscription') || lowerResponse.includes('freemium') || 
      lowerResponse.includes('saas') || lowerResponse.includes('money') || lowerResponse.includes('make money') ||
      lowerResponse.includes('pricing') || lowerResponse.includes('fee') || lowerResponse.includes('commission') ||
      lowerResponse.includes('charge') || lowerResponse.includes('advertise')) {
    extracted.businessModel = response;
    topicsCovered.push('businessModel');
  }
  
  if (lowerResponse.includes('unique') || lowerResponse.includes('advantage') || lowerResponse.includes('different') || 
      lowerResponse.includes('patent') || lowerResponse.includes('special') || lowerResponse.includes('exclusive') ||
      lowerResponse.includes('proprietary') || lowerResponse.includes('barrier') || lowerResponse.includes('owner') ||
      lowerResponse.includes('nyc') || lowerResponse.includes('community') || lowerResponse.includes('ties') ||
      lowerResponse.includes('restaurant owner')) {
    extracted.competitiveAdvantage = response;
    topicsCovered.push('competitiveAdvantage');
  }
  
  if (lowerResponse.includes('team') || lowerResponse.includes('founder') || lowerResponse.includes('experience') || 
      lowerResponse.includes('background') || lowerResponse.includes('expertise') || lowerResponse.includes('skill') ||
      lowerResponse.includes('cto') || lowerResponse.includes('myself')) {
    extracted.team = response;
    topicsCovered.push('team');
  }
  
  if (lowerResponse.includes('traction') || lowerResponse.includes('users') || lowerResponse.includes('growth') || 
      lowerResponse.includes('revenue') || lowerResponse.includes('customers') || lowerResponse.includes('partnership') ||
      lowerResponse.includes('milestone') || lowerResponse.includes('metric') || lowerResponse.includes('1000') ||
      lowerResponse.includes('$10,000') || lowerResponse.includes('$10000')) {
    extracted.traction = response;
    topicsCovered.push('traction');
  }
  
  if (lowerResponse.includes('funding') || lowerResponse.includes('raise') || lowerResponse.includes('investment') || 
      lowerResponse.includes('dollar') || lowerResponse.includes('money') || lowerResponse.includes('capital') ||
      lowerResponse.includes('seed') || lowerResponse.includes('series') || lowerResponse.includes('million') ||
      lowerResponse.includes('expand') || lowerResponse.includes('marketing')) {
    extracted.fundingAsk = response;
    topicsCovered.push('fundingAsk');
  }
  
  return { extracted, topicsCovered };
}

// Function to evaluate responses against startup principles
async function evaluateResponsesAgainstStartupPrinciples(userResponses: Partial<StartupIdea>): Promise<{ refinementAreas: RefinementArea[]; startupPrinciples: string[] }> {
  const refinementAreas: RefinementArea[] = [];
  const startupPrinciples: string[] = [];
  
  const retrievalService = new RetrievalService();
  
  // Evaluate each area
  const evaluations = [
    {
      topic: 'Problem Statement',
      key: 'problem',
      response: userResponses.problem,
      query: 'problem statement pitch deck clear urgent',
      minLength: 50,
      priority: 'high' as const
    },
    {
      topic: 'Solution',
      key: 'solution', 
      response: userResponses.solution,
      query: 'solution simple clear pitch deck',
      minLength: 30,
      priority: 'high' as const
    },
    {
      topic: 'Market Opportunity',
      key: 'market',
      response: userResponses.targetMarket,
      query: 'market size opportunity TAM SAM',
      minLength: 40,
      priority: 'high' as const
    },
    {
      topic: 'Business Model',
      key: 'businessModel',
      response: userResponses.businessModel,
      query: 'business model revenue monetization',
      minLength: 30,
      priority: 'medium' as const
    },
    {
      topic: 'Competitive Advantage',
      key: 'competitiveAdvantage',
      response: userResponses.competitiveAdvantage,
      query: 'competitive advantage moat barrier',
      minLength: 30,
      priority: 'medium' as const
    },
    {
      topic: 'Team',
      key: 'team',
      response: userResponses.team,
      query: 'team founder experience background',
      minLength: 20,
      priority: 'medium' as const
    },
    {
      topic: 'Traction',
      key: 'traction',
      response: userResponses.traction,
      query: 'traction metrics growth validation',
      minLength: 20,
      priority: 'low' as const
    },
    {
      topic: 'Funding Ask',
      key: 'fundingAsk',
      response: userResponses.fundingAsk,
      query: 'funding ask amount use of funds',
      minLength: 20,
      priority: 'low' as const
    }
  ];

  for (const evaluation of evaluations) {
    const guidance = await retrievalService.searchDocuments(evaluation.query);
    startupPrinciples.push(`${evaluation.topic}: ${guidance.substring(0, 100)}...`);
    
    if (!evaluation.response || evaluation.response.length < evaluation.minLength) {
      refinementAreas.push({
        topic: evaluation.topic,
        currentUnderstanding: evaluation.response || 'Not provided',
        suggestedQuestions: getSuggestedQuestionsForTopic(evaluation.key),
        priority: evaluation.priority
      });
    }
  }

  return { refinementAreas, startupPrinciples };
}

function getSuggestedQuestionsForTopic(topic: string): string[] {
  const questions = {
    problem: [
      "What specific pain point are you addressing?",
      "How do people currently solve this problem?",
      "What makes this problem urgent and important?"
    ],
    solution: [
      "How does your solution work in simple terms?",
      "What are the key features of your product?",
      "How does it solve the problem better than existing solutions?"
    ],
    market: [
      "Who are your target customers?",
      "What's the total addressable market size?",
      "How will you reach your customers?"
    ],
    businessModel: [
      "How do you generate revenue?",
      "What's your pricing strategy?",
      "What are your customer acquisition costs?"
    ],
    competitiveAdvantage: [
      "What makes you unique?",
      "What barriers to entry do you have?",
      "How do you protect your competitive position?"
    ],
    team: [
      "What relevant experience do you have?",
      "Why is your team uniquely qualified?",
      "What key roles do you need to fill?"
    ],
    traction: [
      "What metrics demonstrate product-market fit?",
      "What's your growth rate?",
      "What partnerships or customers do you have?"
    ],
    fundingAsk: [
      "How much funding are you seeking?",
      "What will you use the funds for?",
      "What's your valuation and terms?"
    ]
  };
  
  return questions[topic as keyof typeof questions] || [];
}

// Mock function to generate pitch deck slides based on startup principles
function generatePitchDeckSlides(idea: StartupIdea, startupPrinciples: string, refinementAreas: RefinementArea[]): PitchDeckSlide[] {
  const slides: PitchDeckSlide[] = [
    {
      slideNumber: 1,
      title: "Company Name",
      content: `[Your Company Name]\nA revolutionary solution to ${idea.problem}`,
    },
    {
      slideNumber: 2,
      title: "The Problem",
      content: idea.problem || "⚠️ NEEDS REFINEMENT: Problem statement requires more clarity",
      keyPoints: refinementAreas.find(area => area.topic === 'Problem Statement') ? 
        ["Area needs refinement", "Consider the suggested questions", "Make problem more specific"] :
        ["Clear articulation of the pain point", "Market size and urgency", "Why existing solutions fail"]
    },
    {
      slideNumber: 3,
      title: "The Solution",
      content: idea.solution || "⚠️ NEEDS REFINEMENT: Solution description requires more detail",
      keyPoints: refinementAreas.find(area => area.topic === 'Solution') ? 
        ["Area needs refinement", "Consider the suggested questions", "Make solution more concrete"] :
        ["Simple, clear explanation", "Key features and benefits", "How it solves the problem"]
    },
    {
      slideNumber: 4,
      title: "Market Opportunity",
      content: idea.targetMarket || "⚠️ NEEDS REFINEMENT: Market opportunity requires quantification",
      keyPoints: refinementAreas.find(area => area.topic === 'Market Opportunity') ? 
        ["Area needs refinement", "Consider the suggested questions", "Include market size numbers"] :
        ["Total Addressable Market (TAM)", "Serviceable Addressable Market (SAM)", "Serviceable Obtainable Market (SOM)"]
    },
    {
      slideNumber: 5,
      title: "Business Model",
      content: idea.businessModel || "⚠️ NEEDS REFINEMENT: Business model requires more detail",
      keyPoints: refinementAreas.find(area => area.topic === 'Business Model') ? 
        ["Area needs refinement", "Consider the suggested questions", "Clarify revenue streams"] :
        ["Revenue streams", "Pricing strategy", "Customer acquisition cost"]
    },
    {
      slideNumber: 6,
      title: "Competitive Advantage",
      content: idea.competitiveAdvantage || "⚠️ NEEDS REFINEMENT: Competitive advantage needs clarification",
      keyPoints: refinementAreas.find(area => area.topic === 'Competitive Advantage') ? 
        ["Area needs refinement", "Consider the suggested questions", "Identify unique differentiators"] :
        ["Unique technology or approach", "Network effects", "Barriers to entry"]
    },
    {
      slideNumber: 7,
      title: "Go-to-Market Strategy",
      content: "How we'll reach and acquire customers",
      keyPoints: ["Customer acquisition channels", "Partnerships", "Marketing strategy"]
    },
    {
      slideNumber: 8,
      title: "Team",
      content: idea.team || "⚠️ NEEDS REFINEMENT: Team information requires more detail",
      keyPoints: refinementAreas.find(area => area.topic === 'Team') ? 
        ["Area needs refinement", "Consider the suggested questions", "Highlight relevant experience"] :
        ["Founder backgrounds", "Relevant experience", "Why this team can execute"]
    },
    {
      slideNumber: 9,
      title: "Traction",
      content: idea.traction || "⚠️ NEEDS REFINEMENT: Traction metrics require more detail",
      keyPoints: refinementAreas.find(area => area.topic === 'Traction') ? 
        ["Area needs refinement", "Consider the suggested questions", "Include specific metrics"] :
        ["User growth metrics", "Revenue milestones", "Customer testimonials"]
    },
    {
      slideNumber: 10,
      title: "Financial Projections",
      content: "3-5 year revenue and growth projections",
      keyPoints: ["Revenue growth", "Key metrics", "Path to profitability"]
    },
    {
      slideNumber: 11,
      title: "Funding Ask",
      content: idea.fundingAsk || "⚠️ NEEDS REFINEMENT: Funding ask requires more detail",
      keyPoints: refinementAreas.find(area => area.topic === 'Funding Ask') ? 
        ["Area needs refinement", "Consider the suggested questions", "Specify amount and use of funds"] :
        ["Amount being raised", "Use of funds", "Valuation and terms"]
    }
  ];

  return slides;
}

// Function to analyze pitch deck against startup principles
function analyzePitchDeck(idea: StartupIdea, startupPrinciples: string, refinementAreas: RefinementArea[]): PitchDeckAnalysis {
  const strengths: string[] = [];
  const weaknesses: string[] = [];
  const suggestions: string[] = [];
  const startupPrinciplesList: string[] = [];

  // Extract startup principles from the retrieved content
  const principles = startupPrinciples.toLowerCase();
  
  if (principles.includes("problem")) {
    startupPrinciplesList.push("Focus on a clear, urgent problem");
    if (idea.problem && idea.problem.length > 50 && !refinementAreas.find(area => area.topic === 'Problem Statement')) {
      strengths.push("Problem is well-articulated");
    } else {
      weaknesses.push("Problem statement needs refinement");
      suggestions.push("Make the problem more concrete with specific examples");
    }
  }

  if (principles.includes("solution")) {
    startupPrinciplesList.push("Simple, clear solution");
    if (idea.solution && idea.solution.length > 30 && !refinementAreas.find(area => area.topic === 'Solution')) {
      strengths.push("Solution is well-defined");
    } else {
      weaknesses.push("Solution needs more detail");
      suggestions.push("Explain how your solution works in simple terms");
    }
  }

  if (principles.includes("market")) {
    startupPrinciplesList.push("Large market opportunity");
    if (idea.targetMarket && (idea.targetMarket.includes("billion") || idea.targetMarket.includes("million")) && !refinementAreas.find(area => area.topic === 'Market Opportunity')) {
      strengths.push("Market size is quantified");
    } else {
      weaknesses.push("Market size not clearly quantified");
      suggestions.push("Include specific market size numbers");
    }
  }

  if (principles.includes("team")) {
    startupPrinciplesList.push("Strong founding team");
    if (idea.team && idea.team.length > 20 && !refinementAreas.find(area => area.topic === 'Team')) {
      strengths.push("Team background is described");
    } else {
      weaknesses.push("Team section needs more detail");
      suggestions.push("Highlight relevant experience and achievements");
    }
  }

  if (principles.includes("traction")) {
    startupPrinciplesList.push("Show traction and progress");
    if (idea.traction && idea.traction.length > 20 && !refinementAreas.find(area => area.topic === 'Traction')) {
      strengths.push("Traction is demonstrated");
    } else {
      weaknesses.push("Traction metrics are missing");
      suggestions.push("Include specific growth metrics and milestones");
    }
  }

  // Add refinement areas to suggestions
  refinementAreas.forEach(area => {
    suggestions.push(`${area.topic}: ${area.suggestedQuestions[0]}`);
  });

  return {
    strengths,
    weaknesses,
    suggestions,
    startupPrinciples: startupPrinciplesList
  };
}

export async function POST(req: Request) {
  try {
    const { messages }: { messages: AgentMessage[] } = await req.json();

    const model = aisdk(openai("gpt-4o"));

    const agent = new Agent({
      name: "Startup Pitch Deck Assistant",
      instructions: `You are an expert startup advisor specializing in helping founders create compelling pitch decks based on startup principles.

      Your role is to:
      1. Ask ALL pitch deck questions upfront in one comprehensive set
      2. Evaluate the user's responses against startup principles using the RAG system
      3. Identify areas needing improvement all at once
      4. Give the user a choice: clarify those areas OR build pitch deck now with current info

      CRITICAL APPROACH:
      - Ask all 8 strategic questions at once, not one by one
      - After receiving responses, evaluate everything against startup principles
      - Present areas needing refinement all together
      - Offer choice: "Would you like to clarify these areas, or should I generate your pitch deck now with areas marked for refinement?"
      - This is much more efficient than back-and-forth questioning
      
      IMPORTANT: When the user says "generate the pitch deck now" or similar, immediately use the generatePitchDeckFromState tool with the information already collected. Do NOT ask for questions again.
      
      CONVERSATION FLOW:
      1. First interaction: Ask all questions upfront
      2. User provides comprehensive answers
      3. Evaluate responses and show refinement areas
      4. User chooses: clarify OR generate now
      5. If "generate now": Use generatePitchDeckFromState tool immediately
      6. If "clarify": Ask for specific clarifications
      
      TOOL USAGE:
      - Use shouldGeneratePitchDeck to detect if user wants to generate
      - Use generatePitchDeckFromState when user wants to generate with existing info
      - Use generatePitchDeck only when you have specific parameters to pass
      - Never ask for questions again after the initial comprehensive set
      
      CRITICAL: If the user has already provided answers to the questions and you've evaluated them, DO NOT ask the questions again. Either generate the pitch deck or ask for specific clarifications on refinement areas only.
      
      Always be encouraging but honest. Focus on actionable advice that follows startup's proven methodologies.`,
      model,
      tools: [
        tool({
          name: "resetConversation",
          description: "Reset the conversation state for a new session",
          parameters: z.object({}),
          execute: async () => {
            resetConversationState();
            return JSON.stringify({
              message: "Conversation reset. Ready to start fresh!",
              questionsRemaining: 8
            });
          },
        }),
        tool({
          name: "getAllPitchDeckQuestions",
          description: "Get all pitch deck questions to ask the user upfront",
          parameters: z.object({}),
          execute: async () => {
            const questions = getAllPitchDeckQuestions();
            return JSON.stringify({
              questions,
              message: "Here are all the questions needed for your pitch deck. Please answer them comprehensively:"
            });
          },
        }),
        tool({
          name: "evaluateComprehensiveResponse",
          description: "Evaluate user's comprehensive response against startup principles",
          parameters: z.object({
            userResponse: z.string().describe("The user's comprehensive response to all questions"),
          }),
          execute: async ({ userResponse }) => {
            const { extracted, topicsCovered } = await analyzeComprehensiveResponse(userResponse);
            const { refinementAreas, startupPrinciples } = await evaluateResponsesAgainstStartupPrinciples(extracted);
            
            // Update conversation state
            conversationState.userResponses = extracted;
            topicsCovered.forEach(topic => {
              conversationState.topicsCovered[topic as keyof typeof conversationState.topicsCovered] = true;
            });
            conversationState.areasNeedingRefinement = refinementAreas.map(area => area.topic);
            
            return JSON.stringify({
              extractedInfo: extracted,
              topicsCovered,
              refinementAreas,
              startupPrinciples,
              message: "Evaluation complete! Here are areas that need refinement:"
            });
          },
        }),
        tool({
          name: "searchStartupPrinciples",
          description: "Search startup's seed fundraising guide for relevant principles and advice",
          parameters: z.object({
            query: z.string().describe("The specific aspect of fundraising to search for (e.g., 'problem statement', 'market size', 'team')"),
          }),
          execute: async ({ query }) => {
            const retrievalService = new RetrievalService();
            const principles = await retrievalService.searchDocuments(query);
            return `Startup Principles for ${query}: ${principles}`;
          },
        }),
        tool({
          name: "shouldGeneratePitchDeck",
          description: "Check if the user wants to generate a pitch deck now",
          parameters: z.object({
            userMessage: z.string().describe("The user's message to analyze"),
          }),
          execute: async ({ userMessage }) => {
            const lowerMessage = userMessage.toLowerCase();
            const generateKeywords = ['generate', 'create', 'build', 'make', 'now', 'pitch deck', 'deck'];
            
            const wantsToGenerate = generateKeywords.some(keyword => lowerMessage.includes(keyword));
            
            return JSON.stringify({
              shouldGenerate: wantsToGenerate,
              message: wantsToGenerate ? 
                "User wants to generate pitch deck now. Use the information already collected." :
                "User does not want to generate pitch deck yet."
            });
          },
        }),
        tool({
          name: "generatePitchDeck",
          description: "Generate a complete pitch deck based on the startup idea and startup principles",
          parameters: z.object({
            companyName: z.string().describe("The name of the startup"),
            problem: z.string().describe("The problem the startup is solving"),
            solution: z.string().describe("The solution the startup offers"),
            targetMarket: z.string().describe("The target market and market size"),
            businessModel: z.string().describe("How the startup makes money"),
            competitiveAdvantage: z.string().describe("What makes this startup unique"),
            team: z.string().nullable().describe("Information about the founding team"),
            traction: z.string().nullable().describe("Current traction and milestones"),
            fundingAsk: z.string().nullable().describe("Funding amount and use of funds"),
          }),
          execute: async ({ companyName, problem, solution, targetMarket, businessModel, competitiveAdvantage, team, traction, fundingAsk }) => {
            const idea: StartupIdea = {
              problem,
              solution,
              targetMarket,
              businessModel,
              competitiveAdvantage,
              team: team || undefined,
              traction: traction || undefined,
              fundingAsk: fundingAsk || undefined,
            };

            const retrievalService = new RetrievalService();
            const startupPrinciples = await retrievalService.searchDocuments("pitch deck structure slides problem solution market team traction");
            
            const refinementAreas = conversationState.areasNeedingRefinement.map(area => ({
              topic: area,
              currentUnderstanding: conversationState.userResponses[area.toLowerCase().replace(' ', '') as keyof typeof conversationState.userResponses] || 'Not provided',
              suggestedQuestions: getSuggestedQuestionsForTopic(area.toLowerCase().replace(' ', '')),
              priority: (area.includes('Problem') || area.includes('Solution') || area.includes('Market') ? 'high' : 
                       area.includes('Business') || area.includes('Competitive') ? 'medium' : 'low') as 'high' | 'medium' | 'low'
            }));
            
            const slides = generatePitchDeckSlides(idea, startupPrinciples, refinementAreas);
            const analysis = analyzePitchDeck(idea, startupPrinciples, refinementAreas);

            const pitchDeck: PitchDeck = {
              companyName,
              slides,
              createdAt: new Date().toISOString(),
            };

            return JSON.stringify({
              pitchDeck,
              analysis,
              refinementAreas,
              message: "Pitch deck generated successfully! Areas marked with ⚠️ NEEDS REFINEMENT require more detail."
            });
          },
        }),
        tool({
          name: "generatePitchDeckFromState",
          description: "Generate a pitch deck using the information already collected in conversation state",
          parameters: z.object({}),
          execute: async () => {
            // Extract information from conversation state
            const idea: StartupIdea = {
              problem: conversationState.userResponses.problem || "Problem not specified",
              solution: conversationState.userResponses.solution || "Solution not specified", 
              targetMarket: conversationState.userResponses.market || "Market not specified",
              businessModel: conversationState.userResponses.businessModel || "Business model not specified",
              competitiveAdvantage: conversationState.userResponses.competitiveAdvantage || "Competitive advantage not specified",
              team: conversationState.userResponses.team,
              traction: conversationState.userResponses.traction,
              fundingAsk: conversationState.userResponses.fundingAsk,
            };

            const retrievalService = new RetrievalService();
            const startupPrinciples = await retrievalService.searchDocuments("pitch deck structure slides problem solution market team traction");
            
            const refinementAreas = conversationState.areasNeedingRefinement.map(area => ({
              topic: area,
              currentUnderstanding: conversationState.userResponses[area.toLowerCase().replace(' ', '') as keyof typeof conversationState.userResponses] || 'Not provided',
              suggestedQuestions: getSuggestedQuestionsForTopic(area.toLowerCase().replace(' ', '')),
              priority: (area.includes('Problem') || area.includes('Solution') || area.includes('Market') ? 'high' : 
                       area.includes('Business') || area.includes('Competitive') ? 'medium' : 'low') as 'high' | 'medium' | 'low'
            }));
            
            const slides = generatePitchDeckSlides(idea, startupPrinciples, refinementAreas);
            const analysis = analyzePitchDeck(idea, startupPrinciples, refinementAreas);

            const pitchDeck: PitchDeck = {
              companyName: "[Your Company Name]",
              slides,
              createdAt: new Date().toISOString(),
            };

            return JSON.stringify({
              pitchDeck,
              analysis,
              refinementAreas,
              message: "Pitch deck generated successfully using your provided information! Areas marked with ⚠️ NEEDS REFINEMENT require more detail."
            });
          },
        }),
      ],
    });

    const latestMessage = messages[messages.length - 1];
    if (!latestMessage || latestMessage.role !== "user") {
      return Response.json(
        { error: "Invalid message format" },
        { status: 400 }
      );
    }

    const runner = new Runner({
      model,
    });

    const stream = await runner.run(agent, latestMessage.content, {
      stream: true,
    });

    const encoder = new TextEncoder();
    const readable = new ReadableStream({
      async start(controller) {
        try {
          const textStream = stream.toTextStream({
            compatibleWithNodeStreams: false,
          });

          for await (const chunk of textStream) {
            const data = `data: ${JSON.stringify({ content: chunk })}\n\n`;
            controller.enqueue(encoder.encode(data));
          }

          await stream.completed;
          controller.enqueue(encoder.encode("data: [DONE]\n\n"));
          controller.close();
        } catch (error) {
          console.error("Streaming error:", error);
          controller.error(error);
        }
      },
    });

    return new Response(readable, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (error) {
    console.error("Error in pitch deck assistant:", error);
    return Response.json(
      { error: "Failed to process request with Pitch Deck Assistant" },
      { status: 500 }
    );
  }
}
