import React, { useState } from "react";
import { Send, ChevronRight } from "lucide-react";

// Types
interface Message {
  message: string;
  type: "sent" | "received";
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
    <div className="flex flex-col h-full bg-gray-100 p-6">
      {/* Greeting Section */}
      <div className="flex items-center mb-8">
        <div className="w-12 h-12 rounded-full bg-amber-600 flex items-center justify-center mr-4">
          <span className="text-2xl">👩‍💼</span>
        </div>
        <h1 className="text-2xl font-semibold text-gray-900">Good day</h1>
      </div>

      {/* Recent chats Section */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-900">Recent chats</h2>
          <ChevronRight className="w-5 h-5 text-gray-600" />
        </div>
        <div className="flex flex-wrap gap-3">
          {recentChats.map((chat: string, index: number) => (
            <button
              key={index}
              onClick={() => onMessageClick(chat)}
              className="px-4 py-3 bg-white rounded-full text-gray-700 text-sm hover:bg-gray-50 transition-colors shadow-sm border border-gray-200"
            >
              {chat}
            </button>
          ))}
        </div>
      </div>

      {/* Explore more Section */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-900">Explore more</h2>
          <ChevronRight className="w-5 h-5 text-gray-600" />
        </div>
        <div className="flex flex-wrap gap-3">
          {exploreMore.map((item: string, index: number) => (
            <button
              key={index}
              onClick={() => onMessageClick(item)}
              className="px-4 py-3 bg-white rounded-full text-gray-700 text-sm hover:bg-gray-50 transition-colors shadow-sm border border-gray-200"
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

  const getAIResponse = (userMessage: string): string => {
    const lowerMessage = userMessage.toLowerCase();

    // Simple keyword-based responses
    if (lowerMessage.includes("cinema") || lowerMessage.includes("movie")) {
      return "Here are some popular cinemas in Abuja:\n\n1. Silverbird Cinemas - Jabi Lake Mall\n2. FilmHouse Cinemas - Wuse 2\n3. Genesis Deluxe Cinemas - The Ceddi Plaza\n\nWould you like directions to any of these?";
    } else if (lowerMessage.includes("home service")) {
      return "Popular businesses offering home services in Abuja include:\n\n• Cleaning services\n• Plumbing & electrical\n• Home repairs\n• Laundry & dry cleaning\n\nWhich category interests you most?";
    } else if (lowerMessage.includes("date") && lowerMessage.includes("idea")) {
      return "Great date ideas in Abuja:\n\n1. Dinner at Zuma Grill\n2. Sunset at Jabi Lake\n3. Art gallery at Nike Art Gallery\n4. Live music at Nkoyo\n5. Picnic at Millennium Park\n\nAll these places have great ambiance!";
    } else if (lowerMessage.includes("nice places") || lowerMessage.includes("visit")) {
      return "Must-visit places in Abuja:\n\n🏛️ Aso Rock\n🕌 National Mosque\n⛪ National Church\n🌳 Millennium Park\n🛍️ Jabi Lake Mall\n🎨 Nike Art Gallery\n\nWould you like more details about any of these?";
    } else if (lowerMessage.includes("restaurant") || lowerMessage.includes("food") || lowerMessage.includes("eat")) {
      return "Top-rated restaurants in Abuja:\n\n🍽️ Nkoyo - Nigerian cuisine\n🍕 Domino's - Pizza & fast food\n🍱 Wakkis - Fine dining\n🌮 Johnny Rockets - American\n☕ The Charcoal Grill\n\nWhat type of cuisine are you in the mood for?";
    } else {
      return "I can help you discover amazing places in Abuja! Try asking about:\n\n• Restaurants and cafes\n• Entertainment venues\n• Shopping centers\n• Tourist attractions\n• Home services\n\nWhat would you like to explore?";
    }
  };

  const handleMessageSubmit = (message: string): void => {
    console.log("Message would be sent:", message);

    // Add user message to UI
    setMessages((prevMessages: Message[]) => [
      ...prevMessages,
      { message: message, type: "sent" },
    ]);

    // Show typing indicator
    setIsTyping(true);

    // Simulate AI response after a short delay
    setTimeout(() => {
      const responses = getAIResponse(message);
      setMessages((prevMessages: Message[]) => [
        ...prevMessages,
        { message: responses, type: "received" },
      ]);
      setIsTyping(false);
    }, 1500);
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
    <div className="flex flex-col justify-between h-full">
      {messages.length > 0 ? (
        <div className="flex-1 flex flex-col">
          <div className="flex-1 overflow-y-auto scrollbar-hide p-4">
            {messages?.map((message: Message, index: number) => (
              <div
                key={index}
                className={`
                  text-sm md:text-base
                  m-2
                  p-4
                  rounded-[10px]
                  max-w-xs md:max-w-md
                  whitespace-pre-line
                  ${
                    message.type === "sent"
                      ? "bg-bg-primary-dark2 text-white ml-auto"
                      : "bg-white text-text-primary mr-auto shadow-sm"
                  }
                `}
              >
                {message.message}
              </div>
            ))}
            {isTyping && (
              <div className="text-sm md:text-base m-2 p-4 rounded-[10px] max-w-xs md:max-w-md bg-white text-text-primary mr-auto shadow-sm">
                <div className="flex gap-1">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
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
      <div>
        <div className="flex items-center gap-3 max-w-4xl mx-auto">
          <div className="flex-1 relative">
            <input
              type="text"
              placeholder="Type in your message"
              value={inputMessage}
              onChange={handleInputChange}
              onKeyDown={handleKeyPress}
              className="w-full px-4 py-3 text-text-primary border border-border-primary rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <button
            onClick={handleFormSubmit}
            disabled={!inputMessage.trim()}
            className="w-12 h-12 bg-bg-primary-dark2 hover:bg-bg-primary-dark2/80 disabled:bg-gray-300 disabled:cursor-not-allowed text-white rounded-full flex items-center justify-center transition-colors"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default ExploreAI;
