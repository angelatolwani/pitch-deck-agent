# Startup Pitch Deck Assistant

A Next.js TypeScript application that helps founders create compelling pitch decks based on proven startup fundraising principles.

## Features

- **AI-Powered Startup Advisor**: Interactive chat interface using OpenAI's Agents SDK
- **Startup-Guided Pitch Deck Generation**: Create structured 11-slide pitch decks following industry-recommended format
- **RAG-Powered Insights**: Leverages proven startup fundraising guides for contextual advice
- **Comprehensive Analysis**: Get feedback on problem, solution, market, team, and more
- **Refinement Suggestions**: Identify areas needing improvement with specific guidance

## Tech Stack

- **Framework**: Next.js 14 with TypeScript
- **AI**: OpenAI Agents SDK with GPT-4
- **Styling**: Tailwind CSS
- **Vector Database**: Vectorize.io (for startup guide retrieval)
- **Deployment**: Vercel-ready

## Prerequisites

1. **Node.js**: Version 18 or higher
2. **OpenAI API Key**: [Get one here](https://platform.openai.com/api-keys)
3. **Vectorize.io Account**: [Sign up here](https://vectorize.io) (for startup guide retrieval)

## Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd agent-next-typescript
```

2. Install dependencies:
```bash
npm install
# or
pnpm install
```

3. Set up environment variables:
```bash
cp .env.example .env.local
```

4. Configure your environment variables in `.env.local`:
```env
OPENAI_API_KEY=your_openai_api_key_here
VECTORIZE_API_KEY=your_vectorize_api_key_here
VECTORIZE_INDEX_NAME=your_index_name_here
```

# Vectorize.io Configuration (for startup guide retrieval)

1. **Create Account**: Sign up at [vectorize.io](https://vectorize.io)
2. **Create Index**: 
   - Go to your dashboard
   - Click "Create Index"
   - Choose "Text" index type
   - Give your key a name (e.g., "startup-pitch-deck-assistant")
3. **Get API Key**:
   - Go to API Keys section
   - Create a new API key
   - Copy the key to your `.env.local` file
4. **Upload Content**:
   - Upload the startup seed fundraising guide content
   - This will be used for RAG-powered insights

## Usage

### 1. Start the Development Server

```bash
npm run dev
# or
pnpm dev
```

- Visit the main page to learn about the Startup Pitch Deck Assistant
- Navigate to `/agents-sdk` to start the interactive chat

### 2. Get Startup-Guided Feedback

The assistant analyzes your idea using proven startup fundraising principles and provides specific feedback.

### 3. Generate Pitch Deck

Create a complete 11-slide pitch deck following industry-recommended structure:

1. **Company Name**: Your startup's name
2. **Problem**: Clear articulation of the pain point
3. **Solution**: How your product solves the problem
4. **Market Opportunity**: Target market and size
5. **Business Model**: How you make money
6. **Competitive Advantage**: What makes you unique
7. **Go-to-Market**: How you'll reach customers
8. **Team**: Founding team background
9. **Traction**: Current progress and metrics
10. **Financial Projections**: Revenue and growth forecasts
11. **Funding Ask**: Amount and use of funds

## Architecture

```
agent-next-typescript/
├── app/
│   ├── agents-sdk/      # Startup assistant API
│   ├── api/
│   │   └── agents-sdk/  # Startup assistant API
│   └── page.tsx         # Landing page
├── components/          # React components
├── lib/
│   ├── retrieval.ts     # RAG service for startup guide
│   └── utils.ts         # Utility functions
├── types/               # TypeScript type definitions
└── public/              # Static assets
```

## Key Components

- **Agent System**: OpenAI Agents SDK for intelligent conversation
- **RAG System**: Retrieves relevant insights from startup fundraising guides
- **Pitch Deck Generator**: Creates structured 11-slide presentations
- **Analysis Engine**: Evaluates startup ideas against proven principles

## API Endpoints

- `POST /api/agents-sdk`: Main chat endpoint for the startup assistant

## Development

### Adding New Tools

1. Define the tool in `app/api/agents-sdk/route.ts`
2. Add appropriate TypeScript types
3. Update the agent instructions if needed

### Customizing the Pitch Deck Format

Modify the `generatePitchDeckSlides` function in the API route to change the slide structure.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## License

MIT License

## Resources

- [OpenAI Agents SDK Documentation](https://sdk.openai.com/docs/agents)
- [Next.js Documentation](https://nextjs.org/docs)
- [Startup Fundraising Guide](https://www.ycombinator.com/library/4A-a-guide-to-seed-fundraising)
