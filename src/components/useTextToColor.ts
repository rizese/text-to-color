import { useState } from "react";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.NEXT_PUBLIC_OPENAI_API_KEY,
  dangerouslyAllowBrowser: true,
});

interface TextToColorResponse {
  color: string;
  imagery: string;
  error?: string;
}

interface Message {
  role: "system" | "user" | "assistant";
  content: string;
}

const SYSTEM_PROMPT: Message = {
  role: "system",
  content:
    "You are a system that processes any input text and outputs a hex color code. \n\nThink carefully about the user's text. Picture in your mind imagery depicting what the user has written. Consider the most dominant aspect of the imagery. Output it. Consider the hue associated with this.\n\nConsider hue the most, it is important. \nA good starting point for saturation would be 40-60%\nSaturation should be boosted (70-90%) for bright, energetic, or happy imagery.\nSaturation at 20% and below is mostly greyscale, which is fine if the imagery is grey.\nTry not to use #00000 or #ffffff, those are quite boring colors - pick something else close.",
};

export function useTextToColor() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [conversationHistory, setConversationHistory] = useState<Message[]>([]);

  const getColorFromText = async (
    text: string,
    keepHistory: boolean = false
  ): Promise<TextToColorResponse> => {
    setIsLoading(true);
    setError(null);

    try {
      // Build messages array based on history preference
      const messages = keepHistory
        ? [
            SYSTEM_PROMPT,
            ...conversationHistory,
            { role: "user", content: text },
          ]
        : [SYSTEM_PROMPT, { role: "user", content: text }];

      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages,
        response_format: { type: "text" },
        temperature: 0,
        max_tokens: 848,
        top_p: 1,
        frequency_penalty: 0,
        presence_penalty: 0,
      });

      const output = response.choices[0].message.content;
      if (!output) throw new Error("No response from API");

      const lines = output.split("\n");
      const imagery = lines[0].replace("Imagery: ", "").trim();
      const hexMatch = output.match(/#[0-9a-fA-F]{6}/);

      if (!hexMatch) {
        throw new Error("No valid color found in response");
      }

      // Update conversation history
      if (keepHistory) {
        const newMessages: Message[] = [
          { role: "user", content: text },
          { role: "assistant", content: output },
        ];
        setConversationHistory((prev) => [...prev, ...newMessages]);
        console.log("Conversation history:", [
          ...conversationHistory,
          ...newMessages,
        ]);
      } else {
        setConversationHistory([]);
        console.log("Conversation history cleared");
      }

      return {
        color: hexMatch[0],
        imagery: imagery,
      };
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to generate color";
      setError(errorMessage);
      return {
        color: "#1f1f1f",
        imagery: "Error occurred",
        error: errorMessage,
      };
    } finally {
      setIsLoading(false);
    }
  };

  return {
    getColorFromText,
    isLoading,
    error,
    conversationHistory,
  };
}
