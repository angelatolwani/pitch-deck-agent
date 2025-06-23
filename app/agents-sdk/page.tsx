"use client";

import type React from "react";

import { useState } from "react";
import Link from "next/link";
import type { PitchDeck, PitchDeckSlide, PitchDeckAnalysis, RefinementArea } from "@/types/pitch-deck";

interface Message {
  role: "user" | "assistant";
  content: string;
}

export default function PitchDeckAssistantPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [pitchDeck, setPitchDeck] = useState<PitchDeck | null>(null);
  const [analysis, setAnalysis] = useState<PitchDeckAnalysis | null>(null);
  const [refinementAreas, setRefinementAreas] = useState<RefinementArea[]>([]);
  const [questionsRemaining, setQuestionsRemaining] = useState<number>(8);

  const resetConversation = () => {
    setMessages([]);
    setPitchDeck(null);
    setAnalysis(null);
    setRefinementAreas([]);
    setQuestionsRemaining(8);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMessage: Message = { role: "user", content: input };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    setMessages((prev) => [...prev, { role: "assistant", content: "" }]);

    try {
      const response = await fetch("/api/agents-sdk", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messages: [...messages, userMessage],
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to get response");
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (!reader) {
        throw new Error("No reader available");
      }

      let buffer = "";
      let done = false;
      let fullResponse = "";

      while (!done) {
        const { value, done: readerDone } = await reader.read();
        done = readerDone;

        if (value) {
          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");

          buffer = lines.pop() || "";

          for (const line of lines) {
            if (line.startsWith("data: ")) {
              const data = line.slice(6).trim();
              if (data === "[DONE]") {
                done = true;
                break;
              }
              if (data) {
                try {
                  const parsed = JSON.parse(data);
                  if (parsed.content) {
                    fullResponse += parsed.content;
                    setMessages((prev) => {
                      const newMessages = [...prev];
                      const lastIndex = newMessages.length - 1;
                      if (
                        lastIndex >= 0 &&
                        newMessages[lastIndex].role === "assistant"
                      ) {
                        newMessages[lastIndex] = {
                          ...newMessages[lastIndex],
                          content: fullResponse,
                        };
                      }
                      return newMessages;
                    });
                  }
                } catch (e) {
                  console.warn("Failed to parse streaming data:", data);
                }
              }
            }
          }
        }
      }

      // Try to extract pitch deck and analysis from the response
      try {
        const jsonMatch = fullResponse.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0]);
          if (parsed.pitchDeck) {
            setPitchDeck(parsed.pitchDeck);
          }
          if (parsed.analysis) {
            setAnalysis(parsed.analysis);
          }
          if (parsed.refinementAreas) {
            setRefinementAreas(parsed.refinementAreas);
          }
          if (parsed.questionsRemaining !== undefined) {
            setQuestionsRemaining(parsed.questionsRemaining);
          }
        }
      } catch (e) {
        console.warn("Could not parse JSON from response");
      }
    } catch (error) {
      console.error("Error:", error);
      setMessages((prev) => {
        const newMessages = [...prev];
        const lastMessage = newMessages[newMessages.length - 1];
        if (lastMessage && lastMessage.role === "assistant") {
          lastMessage.content = "Sorry, there was an error processing your request.";
        }
        return newMessages;
      });
    } finally {
      setIsLoading(false);
    }
  };

  const renderPitchDeckSlide = (slide: PitchDeckSlide) => (
    <div key={slide.slideNumber} className="bg-white rounded-xl shadow-sm border p-6 mb-4">
      <div className="flex items-center mb-4">
        <div className="bg-blue-100 text-blue-600 rounded-full w-10 h-10 flex items-center justify-center text-sm font-bold mr-4">
          {slide.slideNumber}
        </div>
        <h3 className="text-xl font-semibold text-gray-800">{slide.title}</h3>
      </div>
      <div
        className={`text-gray-700 whitespace-pre-wrap mb-4 ${slide.content.includes("⚠️ NEEDS REFINEMENT") ? "bg-yellow-50 p-4 rounded-lg border-l-4 border-yellow-400" : ""}`}
      >
        {slide.content}
      </div>
      {slide.keyPoints && slide.keyPoints.length > 0 && (
        <div className="bg-gray-50 p-4 rounded-lg">
          <h4 className="text-sm font-semibold text-gray-600 mb-3">Key Points:</h4>
          <ul className="text-sm text-gray-600 space-y-2">
            {slide.keyPoints.map((point, index) => (
              <li key={index} className="flex items-start">
                <span className="text-blue-500 mr-3 mt-1">•</span>
                <span>{point}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );

  const renderAnalysis = (analysis: PitchDeckAnalysis) => (
    <div className="bg-white rounded-xl shadow-sm border p-6 mb-6">
      <h3 className="text-xl font-semibold text-gray-800 mb-6">Startup Analysis</h3>

      {analysis.strengths.length > 0 && (
        <div className="mb-6">
          <h4 className="text-sm font-semibold text-green-600 mb-3 flex items-center">
            <span className="mr-2">✅</span>
            Strengths
          </h4>
          <ul className="text-sm text-gray-700 space-y-2">
            {analysis.strengths.map((strength, index) => (
              <li key={index} className="flex items-start">
                <span className="text-green-500 mr-3 mt-1">•</span>
                <span>{strength}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {analysis.weaknesses.length > 0 && (
        <div className="mb-6">
          <h4 className="text-sm font-semibold text-orange-600 mb-3 flex items-center">
            <span className="mr-2">⚠️</span>
            Areas for Improvement
          </h4>
          <ul className="text-sm text-gray-700 space-y-2">
            {analysis.weaknesses.map((weakness, index) => (
              <li key={index} className="flex items-start">
                <span className="text-orange-500 mr-3 mt-1">•</span>
                <span>{weakness}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {analysis.suggestions.length > 0 && (
        <div className="mb-6">
          <h4 className="text-sm font-semibold text-blue-600 mb-3 flex items-center">
            <span className="mr-2">💡</span>
            Suggestions
          </h4>
          <ul className="text-sm text-gray-700 space-y-2">
            {analysis.suggestions.map((suggestion, index) => (
              <li key={index} className="flex items-start">
                <span className="text-blue-500 mr-3 mt-1">•</span>
                <span>{suggestion}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {analysis.startupPrinciples.length > 0 && (
        <div className="bg-purple-50 border border-purple-200 rounded-xl p-6">
          <h4 className="text-sm font-semibold text-purple-600 mb-3 flex items-center">
            <span className="mr-2">🎯</span>
            Startup Principles Applied
          </h4>
          <ul className="text-sm text-gray-700 space-y-2">
            {analysis.startupPrinciples.map((principle, index) => (
              <li key={index} className="flex items-start">
                <span className="text-purple-500 mr-3 mt-1">•</span>
                <span>{principle}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );

  const renderRefinementAreas = (areas: RefinementArea[]) => (
    <div className="bg-white rounded-xl shadow-sm border p-6 mb-6">
      <h3 className="text-xl font-semibold text-gray-800 mb-6">Areas Needing Refinement</h3>
      <div className="space-y-6">
        {areas.map((area, index) => (
          <div key={index} className="border-l-4 border-yellow-400 pl-6 bg-yellow-50 p-4 rounded-r-lg">
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-semibold text-gray-800">{area.topic}</h4>
              <span
                className={`text-xs px-3 py-1 rounded-full font-medium ${
                  area.priority === "high"
                    ? "bg-red-100 text-red-700"
                    : area.priority === "medium"
                      ? "bg-yellow-100 text-yellow-700"
                      : "bg-blue-100 text-blue-700"
                }`}
              >
                {area.priority} priority
              </span>
            </div>
            <p className="text-sm text-gray-600 mb-4">
              <strong>Current understanding:</strong> {area.currentUnderstanding}
            </p>
            <div>
              <p className="text-sm font-semibold text-gray-700 mb-2">Suggested questions to consider:</p>
              <ul className="text-sm text-gray-600 space-y-2">
                {area.suggestedQuestions.map((question, qIndex) => (
                  <li key={qIndex} className="flex items-start">
                    <span className="text-yellow-500 mr-3 mt-1">•</span>
                    <span>{question}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

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
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 gap-8">
            {/* Chat Interface */}
            <div className="space-y-6">
              <div className="bg-white rounded-xl shadow-sm border">
                <div className="p-6 border-b">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-gray-800">Conversation</h3>
                    <button
                      onClick={resetConversation}
                      className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-1 rounded-lg text-sm font-medium transition-colors"
                    >
                      Reset
                    </button>
                  </div>
                </div>
                <div className="h-96 overflow-y-auto p-6">
                  {messages.length === 0 ? (
                    <div className="text-center py-8">
                      <div className="text-blue-600 text-4xl mb-4">💡</div>
                      <h4 className="font-semibold text-gray-800 mb-3">Ready to build your pitch deck?</h4>
                      <p className="text-gray-600 mb-4">
                        Start by telling me about your startup idea. Here are some examples:
                      </p>
                      <div className="bg-gray-50 rounded-lg p-4 text-left space-y-2">
                        <p className="text-sm text-gray-600">
                          "I'm building a platform that helps small businesses manage their inventory..."
                        </p>
                        <p className="text-sm text-gray-600">
                          "My startup solves food waste by connecting restaurants with local charities..."
                        </p>
                        <p className="text-sm text-gray-600">
                          "I want to create an AI tool that helps students learn programming..."
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {messages.map((message, index) => (
                        <div
                          key={index}
                          className={`p-4 rounded-lg ${
                            message.role === "user"
                              ? "bg-blue-50 border border-blue-200 ml-8"
                              : "bg-gray-50 border mr-8"
                          }`}
                        >
                          <div className="font-semibold text-sm mb-2 text-gray-700">
                            {message.role === "user" ? "You" : "Startup Assistant"}
                          </div>
                          <div className="whitespace-pre-wrap text-sm text-gray-700">{message.content}</div>
                        </div>
                      ))}
                      {isLoading && (
                        <div className="bg-gray-50 border mr-8 p-4 rounded-lg">
                          <div className="font-semibold text-sm mb-2 text-gray-700">Startup Assistant</div>
                          <div className="flex items-center text-gray-500">
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
                            Analyzing your idea...
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
                <div className="p-6 border-t">
                  <form onSubmit={handleSubmit} className="flex gap-3">
                    <input
                      type="text"
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      placeholder="Tell me about your startup idea..."
                      className="flex-1 p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      disabled={isLoading}
                    />
                    <button
                      type="submit"
                      disabled={isLoading || !input.trim()}
                      className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Send
                    </button>
                  </form>
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
