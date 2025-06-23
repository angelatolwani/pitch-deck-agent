import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50">
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold text-gray-800 mb-6">
            Pitch Deck Assistant
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-8">
            Transform your startup idea into a compelling pitch deck using a leading startup accelerator's proven seed fundraising principles. 
            Get expert guidance, structured feedback, and a professional presentation ready for investors.
          </p>
          <div className="flex justify-center gap-4">
            <Link
              href="/agents-sdk"
              className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-lg font-semibold text-lg transition-colors"
            >
              Start Building Your Pitch Deck
            </Link>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-8 mb-16">
          <div className="bg-white p-8 rounded-xl shadow-sm border">
            <div className="text-blue-600 text-3xl mb-4">🎯</div>
            <h3 className="text-xl font-semibold mb-3">Startup Principles</h3>
            <p className="text-gray-600">
              Built on proven seed fundraising methodology. Get insights from successful startup accelerators and investors.
            </p>
          </div>
          
          <div className="bg-white p-8 rounded-xl shadow-sm border">
            <div className="text-blue-600 text-3xl mb-4">💡</div>
            <h3 className="text-xl font-semibold mb-3">Idea Refinement</h3>
            <p className="text-gray-600">
              Get expert feedback on your startup idea. We'll help you clarify your problem, solution, and market opportunity.
            </p>
          </div>
          
          <div className="bg-white p-8 rounded-xl shadow-sm border">
            <div className="text-blue-600 text-3xl mb-4">📊</div>
            <h3 className="text-xl font-semibold mb-3">Structured Output</h3>
            <p className="text-gray-600">
              Generate a complete 11-slide pitch deck following industry-recommended format. Ready to present to investors.
            </p>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border p-8">
          <h2 className="text-2xl font-semibold mb-6 text-center">How It Works</h2>
          <div className="grid md:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="bg-blue-100 text-blue-600 rounded-full w-12 h-12 flex items-center justify-center font-bold text-lg mx-auto mb-3">
                1
              </div>
              <h4 className="font-semibold mb-2">Share Your Idea</h4>
              <p className="text-sm text-gray-600">
                Tell us about your startup concept, problem, and solution
              </p>
            </div>
            
            <div className="text-center">
              <div className="bg-blue-100 text-blue-600 rounded-full w-12 h-12 flex items-center justify-center font-bold text-lg mx-auto mb-3">
                2
              </div>
              <h4 className="font-semibold mb-2">Get Feedback</h4>
              <p className="text-sm text-gray-600">
                Receive analysis based on proven startup principles and best practices
              </p>
            </div>
            
            <div className="text-center">
              <div className="bg-blue-100 text-blue-600 rounded-full w-12 h-12 flex items-center justify-center font-bold text-lg mx-auto mb-3">
                3
              </div>
              <h4 className="font-semibold mb-2">Refine & Iterate</h4>
              <p className="text-sm text-gray-600">
                Improve your pitch with specific suggestions and guidance
              </p>
            </div>
            
            <div className="text-center">
              <div className="bg-blue-100 text-blue-600 rounded-full w-12 h-12 flex items-center justify-center font-bold text-lg mx-auto mb-3">
                4
              </div>
              <h4 className="font-semibold mb-2">Generate Deck</h4>
              <p className="text-sm text-gray-600">
                Create a professional pitch deck ready for investors
              </p>
            </div>
          </div>
        </div>

        <div className="text-center mt-16">
          <p className="text-gray-600 mb-4">
            Powered by OpenAI Agents SDK and proven startup fundraising guides
          </p>
          <div className="flex justify-center gap-4 text-sm text-gray-500">
            <a 
              href="https://www.ycombinator.com/library/4A-a-guide-to-seed-fundraising" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-blue-600 hover:text-blue-800 underline"
            >
              Startup Fundraising Guide
            </a>
            <span>•</span>
            <a 
              href="https://github.com/openai/agents" 
              target="_blank" 
              rel="noopener noreferrer"
              className="hover:text-blue-600 transition-colors"
            >
              OpenAI Agents SDK
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
