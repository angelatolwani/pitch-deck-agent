import Link from "next/link";
import PitchDeckAssistantClient from "@/components/pitch-deck-assistant-client";

export default function PitchDeckAssistantPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="mb-6">
            <Link href="/" className="text-blue-600 hover:text-blue-800 text-sm font-medium transition-colors">
              ← Back to Home
            </Link>
          </div>
          <h1 className="text-4xl font-bold text-gray-800 mb-4">Startup Pitch Deck Assistant</h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Get expert guidance on refining your startup idea and creating a compelling pitch deck based on proven
            startup principles.
          </p>
        </div>

        {/* How It Works Card */}
        <div className="max-w-4xl mx-auto mb-8">
          <div className="bg-white rounded-xl shadow-sm border p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">How It Works</h3>
            <div className="grid md:grid-cols-4 gap-6">
              <div className="text-center">
                <div className="bg-blue-100 text-blue-600 rounded-full w-12 h-12 flex items-center justify-center font-bold text-lg mx-auto mb-3">
                  1
                </div>
                <h4 className="font-semibold mb-2">Share Your Idea</h4>
                <p className="text-sm text-gray-600">Tell us about your startup concept and vision</p>
              </div>
              <div className="text-center">
                <div className="bg-blue-100 text-blue-600 rounded-full w-12 h-12 flex items-center justify-center font-bold text-lg mx-auto mb-3">
                  2
                </div>
                <h4 className="font-semibold mb-2">Interactive Discussion</h4>
                <p className="text-sm text-gray-600">Engage in a guided conversation about your business</p>
              </div>
              <div className="text-center">
                <div className="bg-blue-100 text-blue-600 rounded-full w-12 h-12 flex items-center justify-center font-bold text-lg mx-auto mb-3">
                  3
                </div>
                <h4 className="font-semibold mb-2">Get Analysis</h4>
                <p className="text-sm text-gray-600">Receive feedback based on startup best practices</p>
              </div>
              <div className="text-center">
                <div className="bg-blue-100 text-blue-600 rounded-full w-12 h-12 flex items-center justify-center font-bold text-lg mx-auto mb-3">
                  4
                </div>
                <h4 className="font-semibold mb-2">Generate Deck</h4>
                <p className="text-sm text-gray-600">Create a professional 11-slide pitch deck</p>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <PitchDeckAssistantClient />
      </div>
    </div>
  );
}
