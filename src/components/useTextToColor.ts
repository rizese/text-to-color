import { useState } from 'react';
import OpenAI from 'openai';

interface Message {
  role: "system" | "user" | "assistant";
  content: string;
}

interface TextToColorResponse {
  color: string;
  imagery: string;
  error?: string;
}

// Create the OpenAI instance once outside the hook
const openai = new OpenAI({
  apiKey: process.env.NEXT_PUBLIC_OPENAI_API_KEY,
  dangerouslyAllowBrowser: true
});

// The system prompt that defines how the model should behave, including few-shot examples
const SYSTEM_PROMPT: Message = {
  role: "system",
  content: "You are a system that processes any input text and outputs a hex color code. \n\nThink carefully about the user's text. Picture in your mind imagery depicting what the user has written. Consider the most dominant aspect of the imagery. Output it. Consider the hue associated with this.\n\nConsider hue the most, it is important. \nA good starting point for saturation would be 40-60%\nSaturation should be boosted (70-90%) for bright, energetic, or happy imagery.\nSaturation at 20% and below is mostly greyscale, which is fine if the imagery is grey.\nTry not to use #00000 or #ffffff, those are quite boring colors - pick something else close.\n\nAlways output in this format\n\nImagery:\nHue: [value] (reasoning)\nSaturation: [value] (reasoning)\nLightness: [value] (reasoning)\n#8b705b (hex value)"
};

// Few-shot examples to help the model understand the expected format
const FEW_SHOT_EXAMPLES: Message[] = [
  {
    role: "user",
    content: "a mountain brook"
  },
  {
    role: "assistant",
    content: "Imagery: A serene mountain brook, with clear water flowing over rocks, surrounded by lush greenery.\nHue: 160 (The dominant aspect is the natural, fresh greenery around the brook.)\nSaturation: 50% (The scene is calm and natural, not overly vibrant.)\nLightness: 50% (Balanced lightness to reflect the natural setting without being too dark or too bright.)\n#4c8c64"
  },
  {
    role: "user",
    content: "a peach"
  },
  {
    role: "assistant",
    content: "Imagery: A ripe, juicy peach with a soft, fuzzy skin and a warm, inviting color.\nHue: 30 (A warm, orange hue to capture the essence of a ripe peach.)\nSaturation: 70% (A vibrant saturation to reflect the bright and appealing nature of the fruit.)\nLightness: 60% (A lighter tone to convey the freshness and juiciness of the peach.)\n#f5a15f"
  },
  {
    role: "user",
    content: "glow in the dark"
  },
  {
    role: "assistant",
    content: "Imagery: The soft, eerie luminescence of objects that glow in the dark, often with a greenish tint.\nHue: 120 (A green hue to represent the typical glow-in-the-dark color.)\nSaturation: 60% (Moderate saturation to reflect the distinct yet soft glow.)\nLightness: 70% (A lighter tone to emphasize the glow against darkness.)\n#9be89b"
  }
];

export function useTextToColor() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [conversationHistory, setConversationHistory] = useState<Message[]>([]);

  const getColorFromText = async (text: string, keepHistory: boolean = false): Promise<TextToColorResponse> => {
    setIsLoading(true);
    setError(null);

    try {
      // Build messages array based on history preference
      let messages: Message[];

      if (keepHistory && conversationHistory.length > 0) {
        // Keep existing conversation going
        messages = [
          SYSTEM_PROMPT,
          ...FEW_SHOT_EXAMPLES,
          ...conversationHistory,
          { role: "user", content: text }
        ];
      } else {
        // Start a new conversation
        messages = [
          SYSTEM_PROMPT,
          ...FEW_SHOT_EXAMPLES,
          { role: "user", content: text }
        ];
      }

      console.log('Sending messages to API:', messages);

      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages,
        response_format: { type: "text" },
        temperature: 0,
        max_tokens: 848,
        top_p: 1,
        frequency_penalty: 0,
        presence_penalty: 0
      });

      const output = response.choices[0].message.content;
      if (!output) throw new Error('No response from API');

      console.log('API response:', output);

      // Parse the response
      const lines = output.split('\n');
      const imagery = lines[0].replace('Imagery: ', '').trim();
      const hexMatch = output.match(/#[0-9a-fA-F]{6}/);

      if (!hexMatch) {
        throw new Error('No valid color found in response');
      }

      // Update conversation history based on the keepHistory flag
      if (keepHistory) {
        // Add this exchange to history
        const newMessages: Message[] = [
          { role: "user", content: text },
          { role: "assistant", content: output }
        ];
        setConversationHistory(prev => [...prev, ...newMessages]);
      } else {
        // Reset history with just this exchange
        setConversationHistory([
          { role: "user", content: text },
          { role: "assistant", content: output }
        ]);
      }

      return {
        color: hexMatch[0],
        imagery: imagery
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
  };

  return {
    getColorFromText,
    isLoading,
    error,
    conversationHistory,
    clearHistory
  };
}
