import { useState } from 'react';
import { ChatMessage } from '@/lib/openai-service';

interface TextToColorResponse {
  color: string;
  rawOutput?: string;
  error?: string;
}

export function useTextToColor() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [conversationHistory, setConversationHistory] = useState<ChatMessage[]>(
    [],
  );

  const getColorFromText = async ({
    text,
    keepHistory,
  }: {
    text: string;
    keepHistory: boolean;
  }): Promise<TextToColorResponse> => {
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
          keepHistory,
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
        const newMessages: ChatMessage[] = [
          { role: 'user', content: text },
          { role: 'assistant', content: data.rawOutput },
        ];
        setConversationHistory((prev) => [...prev, ...newMessages]);
      } else {
        // Reset history with just this exchange
        setConversationHistory([
          { role: 'user', content: text },
          { role: 'assistant', content: data.rawOutput },
        ]);
      }

      return {
        color: data.color,
        rawOutput: data.rawOutput,
      };
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Failed to generate color';
      setError(errorMessage);
      console.error('Error in getColorFromText:', errorMessage);
      return {
        color: '#1f1f1f',
        error: errorMessage,
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
    clearHistory,
  };
}
