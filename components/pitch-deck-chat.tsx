"use client";

import { useState, useEffect, useRef } from "react";

interface Message {
  role: "user" | "assistant";
  content: string;
}

export default function PitchDeckChat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const resetConversation = () => {
    setMessages([]);
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

  return (
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
                    {message.role === "user" ? "You" : "Assistant"}
                  </div>
                  <div className="text-gray-800 whitespace-pre-wrap">{message.content}</div>
                </div>
              ))}
              <div ref={messagesEndRef} />
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
              disabled={isLoading}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
            />
            <button
              type="submit"
              disabled={isLoading || !input.trim()}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {isLoading ? "Sending..." : "Send"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
} 