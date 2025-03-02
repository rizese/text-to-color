import { useState } from 'react';

interface Message {
  role: "system" | "user" | "assistant";
  content: string;
}

interface TextToColorResponse {
  color: string;
  imagery: string;
  error?: string;
}

export function useTextToColor() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [conversationHistory, setConversationHistory] = useState<Message[]>([]);

  const getColorFromText = async (text: string, keepHistory: boolean = false): Promise<TextToColorResponse> => {
    setIsLoading(true);
    setError(null);

    try {
      // Call our API endpoint
      const response = await fetch('/api/text-to-color', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text,
          conversationHistory,
          keepHistory
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to get color');
      }

      const data = await response.json();

      // Update conversation history based on the keepHistory flag
      if (keepHistory) {
        // Add this exchange to history
        const newMessages: Message[] = [
          { role: "user", content: text },
          { role: "assistant", content: data.rawOutput }
        ];
        setConversationHistory(prev => [...prev, ...newMessages]);
        console.log('Updated conversation history with new exchange, keeping previous history');
      } else {
        // Reset history with just this exchange
        setConversationHistory([
          { role: "user", content: text },
          { role: "assistant", content: data.rawOutput }
        ]);
        console.log('Reset conversation history with just this exchange');
      }

      return {
        color: data.color,
        imagery: data.imagery
      };

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to generate color';
      setError(errorMessage);
      console.error('Error in getColorFromText:', errorMessage);
      return {
        color: '#1f1f1f',
        imagery: 'Error occurred',
        error: errorMessage
      };
    } finally {
      setIsLoading(false);
    }
  };

  const clearHistory = () => {
    setConversationHistory([]);
    console.log('Conversation history cleared');
  };

  return {
    getColorFromText,
    isLoading,
    error,
    conversationHistory,
    clearHistory
  };
}
