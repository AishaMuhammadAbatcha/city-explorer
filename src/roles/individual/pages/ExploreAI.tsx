import React, { useState } from "react";
import { Send, ChevronRight } from "lucide-react";
import { GeminiService } from "@/services/geminiService";
import { toast } from "sonner";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

// Types
interface Message {
  message: string;
  type: "sent" | "received";
  role?: "user" | "assistant";
}

interface EmptyStateProps {
  onMessageClick: (message: string) => void;
}

// Mock schema validation - simplified version
const validateMessage = (message: string): string | null => {
  if (!message || message.trim().length === 0) {
    return "Message cannot be empty";
  }
  if (message.length > 500) {
    return "Message too long";
  }
  return null;
};

// EmptyState component matching the image design
const EmptyState: React.FC<EmptyStateProps> = ({ onMessageClick }) => {
  const recentChats: string[] = [
    "List of cinemas",
    "Businesses that offer home services to",
  ];

  const exploreMore: string[] = [
    "Date ideas in Abuja",
    "Nice places to visit in Abuja",
  ];

  return (
    <div className="flex flex-col h-full bg-gray-100 dark:bg-gray-900 p-4 sm:p-6">
      {/* Greeting Section */}
      <div className="flex items-center mb-6 sm:mb-8">
        <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-amber-600 dark:bg-amber-700 flex items-center justify-center mr-3 sm:mr-4 flex-shrink-0">
          <span className="text-xl sm:text-2xl">👩‍💼</span>
        </div>
        <h1 className="text-xl sm:text-2xl font-semibold text-gray-900 dark:text-gray-100">Good day</h1>
      </div>

      {/* Recent chats Section */}
      <div className="mb-6 sm:mb-8">
        <div className="flex items-center justify-between mb-3 sm:mb-4">
          <h2 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-gray-100">Recent chats</h2>
          <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5 text-gray-600 dark:text-gray-400 flex-shrink-0" />
        </div>
        <div className="flex flex-wrap gap-2 sm:gap-3">
          {recentChats.map((chat: string, index: number) => (
            <button
              key={index}
              onClick={() => onMessageClick(chat)}
              className="px-3 py-2 sm:px-4 sm:py-3 bg-white dark:bg-gray-800 rounded-full text-gray-700 dark:text-gray-300 text-xs sm:text-sm hover:bg-gray-50 dark:hover:bg-gray-700 active:bg-gray-100 dark:active:bg-gray-600 transition-colors shadow-sm border border-gray-200 dark:border-gray-700 whitespace-nowrap"
            >
              {chat}
            </button>
          ))}
        </div>
      </div>

      {/* Explore more Section */}
      <div className="mb-6 sm:mb-8">
        <div className="flex items-center justify-between mb-3 sm:mb-4">
          <h2 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-gray-100">Explore more</h2>
          <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5 text-gray-600 dark:text-gray-400 flex-shrink-0" />
        </div>
        <div className="flex flex-wrap gap-2 sm:gap-3">
          {exploreMore.map((item: string, index: number) => (
            <button
              key={index}
              onClick={() => onMessageClick(item)}
              className="px-3 py-2 sm:px-4 sm:py-3 bg-white dark:bg-gray-800 rounded-full text-gray-700 dark:text-gray-300 text-xs sm:text-sm hover:bg-gray-50 dark:hover:bg-gray-700 active:bg-gray-100 dark:active:bg-gray-600 transition-colors shadow-sm border border-gray-200 dark:border-gray-700"
            >
              {item}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

const ExploreAI: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState<string>("");
  const [isTyping, setIsTyping] = useState<boolean>(false);

  const handleMessageSubmit = async (message: string): Promise<void> => {
    console.log("Message being sent:", message);

    // Add user message to UI
    const newUserMessage: Message = {
      message: message,
      type: "sent",
      role: "user"
    };

    setMessages((prevMessages: Message[]) => [
      ...prevMessages,
      newUserMessage,
    ]);

    // Show typing indicator
    setIsTyping(true);

    try {
      // Build conversation history for context
      const conversationHistory = messages.map(msg => ({
        role: msg.role || (msg.type === "sent" ? "user" : "assistant") as "user" | "assistant",
        content: msg.message
      }));

      // Get AI response using Gemini
      const aiResponse = await GeminiService.generateChatResponse(
        message,
        conversationHistory
      );

      // Add AI response to UI
      setMessages((prevMessages: Message[]) => [
        ...prevMessages,
        {
          message: aiResponse,
          type: "received",
          role: "assistant"
        },
      ]);
    } catch (error) {
      console.error("Error getting AI response:", error);
      toast.error("Failed to get AI response. Please try again.");

      // Add error message to UI
      setMessages((prevMessages: Message[]) => [
        ...prevMessages,
        {
          message: "I apologize, but I'm having trouble responding right now. Please try again in a moment.",
          type: "received",
          role: "assistant"
        },
      ]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleFormSubmit = (): void => {
    const validationError: string | null = validateMessage(inputMessage);
    if (validationError) {
      return;
    }

    handleMessageSubmit(inputMessage);
    setInputMessage("");
  };

  const handleEmptyStateMessageClick = (message: string): void => {
    setInputMessage(message);
    handleMessageSubmit(message);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    setInputMessage(e.target.value);
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>): void => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleFormSubmit();
    }
  };

  return (
    <div className="flex flex-col justify-between h-full max-w-7xl mx-auto w-full">
      {messages.length > 0 ? (
        <div className="flex-1 flex flex-col">
          <div className="flex-1 overflow-y-auto scrollbar-hide p-3 sm:p-4 px-4 sm:px-6 lg:px-8">
            {messages?.map((message: Message, index: number) => (
              <div
                key={index}
                className={`
                  flex
                  ${message.type === "sent" ? "justify-end" : "justify-start"}
                `}
              >
                <div
                  className={`
                    text-xs sm:text-sm md:text-base
                    m-1 sm:m-2
                    p-3 sm:p-4
                    rounded-[10px]
                    max-w-[85%] sm:max-w-xs md:max-w-md
                    ${
                      message.type === "sent"
                        ? "bg-bg-primary-dark2 text-white whitespace-pre-line"
                        : "bg-white dark:bg-gray-800 text-text-primary shadow-sm"
                    }
                  `}
                >
                {message.type === "sent" ? (
                  message.message
                ) : (
                  <div className="prose prose-sm dark:prose-invert max-w-none">
                    <ReactMarkdown
                      remarkPlugins={[remarkGfm]}
                      components={{
                        p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
                        ul: ({ children }) => <ul className="list-disc list-inside mb-2 space-y-1">{children}</ul>,
                        ol: ({ children }) => <ol className="list-decimal list-inside mb-2 space-y-1">{children}</ol>,
                        li: ({ children }) => <li className="ml-2">{children}</li>,
                        strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
                        em: ({ children }) => <em className="italic">{children}</em>,
                        code: ({ children }) => <code className="bg-gray-100 dark:bg-gray-700 px-1 py-0.5 rounded text-sm">{children}</code>,
                        pre: ({ children }) => <pre className="bg-gray-100 dark:bg-gray-700 p-2 rounded overflow-x-auto mb-2">{children}</pre>,
                        a: ({ children, href }) => <a href={href} className="text-blue-500 dark:text-blue-400 underline" target="_blank" rel="noopener noreferrer">{children}</a>,
                        h1: ({ children }) => <h1 className="text-lg font-bold mb-2">{children}</h1>,
                        h2: ({ children }) => <h2 className="text-base font-bold mb-2">{children}</h2>,
                        h3: ({ children }) => <h3 className="text-sm font-bold mb-1">{children}</h3>,
                        blockquote: ({ children }) => <blockquote className="border-l-4 border-gray-300 dark:border-gray-600 pl-3 italic my-2">{children}</blockquote>,
                      }}
                    >
                      {message.message}
                    </ReactMarkdown>
                  </div>
                )}
                </div>
              </div>
            ))}
            {isTyping && (
              <div className="flex justify-start">
                <div className="text-xs sm:text-sm md:text-base m-1 sm:m-2 p-3 sm:p-4 rounded-[10px] max-w-[85%] sm:max-w-xs md:max-w-md bg-white dark:bg-gray-800 text-text-primary shadow-sm">
                <div className="flex gap-1">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                </div>
                </div>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto">
          <EmptyState onMessageClick={handleEmptyStateMessageClick} />
        </div>
      )}

      {/* Bottom Input Field */}
      <div className="p-3 sm:p-4 px-4 sm:px-6 lg:px-8 bg-gray-100 dark:bg-gray-900">
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="flex-1 relative">
            <input
              type="text"
              placeholder="Type in your message"
              value={inputMessage}
              onChange={handleInputChange}
              onKeyDown={handleKeyPress}
              className="w-full px-3 py-2 sm:px-4 sm:py-3 text-sm sm:text-base text-text-primary bg-white dark:bg-gray-800 border border-border-primary rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <button
            onClick={handleFormSubmit}
            disabled={!inputMessage.trim()}
            className="w-10 h-10 sm:w-12 sm:h-12 bg-bg-primary-dark2 hover:bg-bg-primary-dark2/80 disabled:bg-gray-300 disabled:cursor-not-allowed text-white rounded-full flex items-center justify-center transition-colors flex-shrink-0 active:scale-95"
          >
            <Send className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default ExploreAI;
