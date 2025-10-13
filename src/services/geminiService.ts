import { GoogleGenerativeAI } from '@google/generative-ai';

// Initialize the Gemini API
const getGeminiAI = () => {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;

  if (!apiKey) {
    console.warn('VITE_GEMINI_API_KEY not found in environment variables. Using mock responses.');
    return null;
  }

  return new GoogleGenerativeAI(apiKey);
};

/**
 * Service for interacting with Google's Gemini AI API
 */
export class GeminiService {
  private static genAI = getGeminiAI();

  /**
   * Generate a chat response using Gemini AI
   * @param userMessage - The user's message
   * @param conversationHistory - Optional conversation history for context
   * @returns AI-generated response
   */
  static async generateChatResponse(
    userMessage: string,
    conversationHistory?: Array<{ role: 'user' | 'assistant'; content: string }>
  ): Promise<string> {
    try {
      // If no API key, use mock responses
      if (!this.genAI) {
        return this.getMockResponse(userMessage);
      }

      // Use the latest free tier model: gemini-2.0-flash-exp
      const model = this.genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });

      // Create a context-aware prompt for city exploration
      const systemPrompt = `You are a helpful AI assistant for City Explorer, an app that helps people discover amazing places, businesses, events, and activities in Nigerian cities, especially Abuja.

Your role is to:
- Recommend restaurants, cafes, entertainment venues, shopping centers, and tourist attractions
- Suggest businesses that offer various services (home services, auto repairs, etc.)
- Provide date ideas and activity suggestions
- Give information about local events and happenings
- Help users discover new places based on their interests

Be friendly, concise, and helpful. Format your responses with bullet points or numbered lists when appropriate. Keep responses focused on locations and businesses in Nigerian cities, particularly Abuja.`;

      // Build the conversation context
      let fullPrompt = systemPrompt + '\n\n';

      if (conversationHistory && conversationHistory.length > 0) {
        // Add recent conversation history (last 5 messages for context)
        const recentHistory = conversationHistory.slice(-5);
        for (const msg of recentHistory) {
          fullPrompt += `${msg.role === 'user' ? 'User' : 'Assistant'}: ${msg.content}\n\n`;
        }
      }

      fullPrompt += `User: ${userMessage}\n\nAssistant:`;

      // Generate response
      const result = await model.generateContent(fullPrompt);
      const response = await result.response;
      const text = response.text();

      return text || 'I apologize, but I could not generate a response. Please try again.';
    } catch (error) {
      console.error('Error generating Gemini response:', error);

      // Fallback to mock responses on error
      return this.getMockResponse(userMessage);
    }
  }

  /**
   * Mock response generator for when API is not available
   * @param userMessage - The user's message
   * @returns A mock response
   */
  private static getMockResponse(userMessage: string): string {
    const lowerMessage = userMessage.toLowerCase();

    // Simple keyword-based responses (fallback)
    if (lowerMessage.includes('cinema') || lowerMessage.includes('movie')) {
      return "Here are some popular cinemas in Abuja:\n\n1. Silverbird Cinemas - Jabi Lake Mall\n2. FilmHouse Cinemas - Wuse 2\n3. Genesis Deluxe Cinemas - The Ceddi Plaza\n\nWould you like directions to any of these?";
    } else if (lowerMessage.includes('home service')) {
      return "Popular businesses offering home services in Abuja include:\n\n• Cleaning services\n• Plumbing & electrical\n• Home repairs\n• Laundry & dry cleaning\n\nWhich category interests you most?";
    } else if (lowerMessage.includes('date') && lowerMessage.includes('idea')) {
      return "Great date ideas in Abuja:\n\n1. Dinner at Zuma Grill\n2. Sunset at Jabi Lake\n3. Art gallery at Nike Art Gallery\n4. Live music at Nkoyo\n5. Picnic at Millennium Park\n\nAll these places have great ambiance!";
    } else if (lowerMessage.includes('nice places') || lowerMessage.includes('visit')) {
      return "Must-visit places in Abuja:\n\n🏛️ Aso Rock\n🕌 National Mosque\n⛪ National Church\n🌳 Millennium Park\n🛍️ Jabi Lake Mall\n🎨 Nike Art Gallery\n\nWould you like more details about any of these?";
    } else if (lowerMessage.includes('restaurant') || lowerMessage.includes('food') || lowerMessage.includes('eat')) {
      return "Top-rated restaurants in Abuja:\n\n🍽️ Nkoyo - Nigerian cuisine\n🍕 Domino's - Pizza & fast food\n🍱 Wakkis - Fine dining\n🌮 Johnny Rockets - American\n☕ The Charcoal Grill\n\nWhat type of cuisine are you in the mood for?";
    } else {
      return "I can help you discover amazing places in Abuja! Try asking about:\n\n• Restaurants and cafes\n• Entertainment venues\n• Shopping centers\n• Tourist attractions\n• Home services\n\nWhat would you like to explore?";
    }
  }

  /**
   * Generate streaming chat response (for real-time responses)
   * @param userMessage - The user's message
   * @param onChunk - Callback function for each chunk of response
   * @returns Promise that resolves when streaming is complete
   */
  static async generateStreamingChatResponse(
    userMessage: string,
    onChunk: (chunk: string) => void,
    conversationHistory?: Array<{ role: 'user' | 'assistant'; content: string }>
  ): Promise<void> {
    try {
      // If no API key, use mock response
      if (!this.genAI) {
        const mockResponse = this.getMockResponse(userMessage);
        onChunk(mockResponse);
        return;
      }

      const model = this.genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });

      const systemPrompt = `You are a helpful AI assistant for City Explorer, an app that helps people discover amazing places in Nigerian cities. Be concise and helpful.`;

      let fullPrompt = systemPrompt + '\n\n';

      if (conversationHistory && conversationHistory.length > 0) {
        const recentHistory = conversationHistory.slice(-5);
        for (const msg of recentHistory) {
          fullPrompt += `${msg.role === 'user' ? 'User' : 'Assistant'}: ${msg.content}\n\n`;
        }
      }

      fullPrompt += `User: ${userMessage}\n\nAssistant:`;

      const result = await model.generateContentStream(fullPrompt);

      for await (const chunk of result.stream) {
        const chunkText = chunk.text();
        onChunk(chunkText);
      }
    } catch (error) {
      console.error('Error generating streaming response:', error);
      const mockResponse = this.getMockResponse(userMessage);
      onChunk(mockResponse);
    }
  }
}
