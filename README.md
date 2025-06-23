# Startup Pitch Deck Assistant

An AI-powered application that helps founders create compelling pitch decks using OpenAI's Agents SDK and proven startup principles.

## 🎯 Demo

**[Demo Video Coming Soon]** - I'll add a demo video showing the application in action.

## ✨ Features

- **AI-Powered Startup Advisor**: Interactive chat interface using OpenAI's Agents SDK
- **Comprehensive Analysis**: Get feedback on problem, solution, market, team, and more
- **Structured Pitch Deck Generation**: Create professional 11-slide pitch decks
- **Refinement Suggestions**: Identify areas needing improvement with specific guidance
- **Modern UI**: Clean, responsive interface built with Next.js and Tailwind CSS

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ 
- OpenAI API key
- Vectorize.io account (for startup guide retrieval)

### Installation

1. **Clone and install dependencies**
   ```bash
   git clone <your-repo-url>
   cd agent-next-typescript
   npm install
   ```

2. **Set up environment variables**
   ```bash
   cp .env.example .env.local
   ```
   
   Add your API keys to `.env.local`:
   ```env
   OPENAI_API_KEY=your_openai_api_key_here
   VECTORIZE_API_KEY=your_vectorize_api_key_here
   VECTORIZE_INDEX_NAME=your_index_name_here
   ```

3. **Start the development server**
   ```bash
   npm run dev
   ```

4. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## 🎯 How It Works

1. **Share Your Idea**: Tell the assistant about your startup concept
2. **Interactive Discussion**: Answer strategic questions about your business
3. **Get Analysis**: Receive feedback based on startup best practices
4. **Generate Deck**: Create a professional 11-slide pitch deck

## 📋 Pitch Deck Structure

The assistant generates a complete 11-slide pitch deck:

1. **Company Name**: Your startup's name and tagline
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

## 🛠️ Tech Stack

- **Framework**: Next.js 14 with TypeScript
- **AI**: OpenAI Agents SDK with GPT-4
- **Styling**: Tailwind CSS
- **Vector Database**: Vectorize.io
- **Deployment**: Vercel-ready

## 📁 Project Structure

```
agent-next-typescript/
├── app/
│   ├── agents-sdk/      # Main pitch deck assistant UI
│   ├── api/agents-sdk/  # Assistant API endpoint
│   ├── layout.tsx       # Root layout
│   └── page.tsx         # Landing page
├── lib/
│   ├── retrieval.ts     # RAG service for startup guides
│   ├── vectorize.ts     # Vectorize.io integration
│   └── utils.ts         # Utility functions
├── types/
│   ├── pitch-deck.ts    # Pitch deck type definitions
│   └── vectorize.ts     # Vectorize API types
└── public/              # Static assets
```

## 🔧 API Endpoints

- `POST /api/agents-sdk`: Main chat endpoint for the startup assistant

## 🚀 Deployment

This project is ready to deploy on Vercel:

1. Push your code to GitHub
2. Connect your repository to Vercel
3. Add your environment variables in Vercel dashboard
4. Deploy!

## 📝 License

MIT License

## 🤝 Contributing

This is a homework project for my instructor. Feel free to fork and modify for your own use!
