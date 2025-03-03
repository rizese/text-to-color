import { NextResponse } from 'next/server';
import OpenAI from 'openai';

// Create the OpenAI instance
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// The system prompt that defines how the model should behave
const SYSTEM_PROMPT = {
  role: 'system',
  content:
    "You are a system that processes any input text and outputs a hex color code. \n\nThink carefully about the user's text. Picture in your mind imagery depicting what the user has written. Consider the most dominant aspect of the imagery. Output it. Consider the hue associated with this.\n\nConsider hue the most, it is important. \nA good starting point for saturation would be 40-60%\nSaturation should be boosted (70-90%) for bright, energetic, or happy imagery.\nSaturation at 20% and below is mostly greyscale, which is fine if the imagery is grey.\nTry not to use #00000 or #ffffff, those are quite boring colors - pick something else close.\n\nAlways output in this format\n\nImagery:\nHue: [value] (reasoning)\nSaturation: [value] (reasoning)\nLightness: [value] (reasoning)\n#8b705b (hex value)",
};

// Few-shot examples to help the model understand the expected format
const FEW_SHOT_EXAMPLES = [
  {
    role: 'user',
    content: 'a mountain brook',
  },
  {
    role: 'assistant',
    content:
      'Imagery: A serene mountain brook, with clear water flowing over rocks, surrounded by lush greenery.\nHue: 160 (The dominant aspect is the natural, fresh greenery around the brook.)\nSaturation: 50% (The scene is calm and natural, not overly vibrant.)\nLightness: 50% (Balanced lightness to reflect the natural setting without being too dark or too bright.)\n#4c8c64',
  },
  {
    role: 'user',
    content: 'a peach',
  },
  {
    role: 'assistant',
    content:
      'Imagery: A ripe, juicy peach with a soft, fuzzy skin and a warm, inviting color.\nHue: 30 (A warm, orange hue to capture the essence of a ripe peach.)\nSaturation: 70% (A vibrant saturation to reflect the bright and appealing nature of the fruit.)\nLightness: 60% (A lighter tone to convey the freshness and juiciness of the peach.)\n#f5a15f',
  },
  {
    role: 'user',
    content: 'glow in the dark',
  },
  {
    role: 'assistant',
    content:
      'Imagery: The soft, eerie luminescence of objects that glow in the dark, often with a greenish tint.\nHue: 120 (A green hue to represent the typical glow-in-the-dark color.)\nSaturation: 60% (Moderate saturation to reflect the distinct yet soft glow.)\nLightness: 70% (A lighter tone to emphasize the glow against darkness.)\n#9be89b',
  },
];

/**
 * Calls the OpenAI API and parses the response
 * @param text The input text
 * @param messages The messages array to send to OpenAI
 * @returns The parsed color and imagery
 */
async function callOpenAIWithRetry(text: string, messages: any[]) {
  // Log what we're sending to OpenAI
  console.log('-------- SENDING TO OPENAI --------');
  console.log('Input text:', text);
  console.log('Total messages:', messages.length);
  console.log('Messages:', messages);

  // Log the last few messages for context verification
  const userMessages = messages.filter((m) => m.role === 'user');
  const assistantMessages = messages.filter((m) => m.role === 'assistant');

  console.log(`User messages: ${userMessages.length}`);
  console.log(
    `Last user message: "${userMessages[userMessages.length - 1]?.content}"`,
  );

  console.log(`Assistant messages: ${assistantMessages.length}`);
  if (assistantMessages.length > 0) {
    console.log(
      `Last assistant message: "${assistantMessages[
        assistantMessages.length - 1
      ]?.content.substring(0, 50)}..."`,
    );
  }
  console.log('-------- END OF REQUEST DATA --------');

  // Maximum number of retry attempts
  const MAX_RETRIES = 1;
  let retryCount = 0;
  let lastError: Error | null = null;

  while (retryCount <= MAX_RETRIES) {
    try {
      // Call OpenAI
      const response = await openai.chat.completions.create({
        model: 'gpt-4o',
        messages,
        response_format: { type: 'text' },
        temperature: 0,
        max_tokens: 848,
        top_p: 1,
        frequency_penalty: 0,
        presence_penalty: 0,
      });

      const output = response.choices[0].message.content;
      if (!output) {
        throw new Error('No response from API');
      }

      console.log('-------- OPENAI RESPONSE --------');
      console.log(
        `Response (first 100 chars): "${output.substring(0, 100)}..."`,
      );

      // Parse the response
      const lines = output.split('\n');
      const imagery = lines[0].replace('Imagery: ', '').trim();
      const hexMatch = output.match(/#[0-9a-fA-F]{6}/);

      if (!hexMatch) {
        console.error('Failed to find hex color in response:', output);
        throw new Error('No valid color found in response');
      }

      console.log(`Extracted color: ${hexMatch[0]}`);
      console.log(`Extracted imagery: "${imagery.substring(0, 50)}..."`);
      console.log('-------- END OF RESPONSE DATA --------');

      // Return successfully parsed data
      return {
        color: hexMatch[0],
        imagery: imagery,
        rawOutput: output,
      };
    } catch (error) {
      lastError = error instanceof Error ? error : new Error('Unknown error');

      // If this is our retry attempt, log a warning
      if (retryCount > 0) {
        console.warn(
          `Retry ${retryCount} failed for text: "${text}". Error: ${lastError.message}`,
        );
      } else {
        console.warn(
          `Initial attempt failed for text: "${text}". Retrying... Error: ${lastError.message}`,
        );
      }

      // Increment retry counter
      retryCount++;

      // If we've reached max retries, throw the last error
      if (retryCount > MAX_RETRIES) {
        throw lastError;
      }
    }
  }

  // This shouldn't be reached due to the throw above, but TypeScript requires a return
  throw new Error('Failed to get valid response after retries');
}

export async function POST(request: Request) {
  try {
    // Parse the request body
    const body = await request.json();
    const { text, conversationHistory = [], keepHistory = false } = body;

    if (!text) {
      return NextResponse.json({ error: 'Text is required' }, { status: 400 });
    }

    console.log('-------- API ROUTE RECEIVED REQUEST --------');
    console.log('Input text:', text);
    console.log('Keep history:', keepHistory);
    console.log('History length:', conversationHistory.length);

    if (conversationHistory.length > 0) {
      console.log('First history item role:', conversationHistory[0].role);
      console.log(
        'Last history item role:',
        conversationHistory[conversationHistory.length - 1].role,
      );
    }

    // Build messages array based on history preference
    let messages;

    if (keepHistory && conversationHistory.length > 0) {
      // Keep existing conversation going
      messages = [
        SYSTEM_PROMPT,
        ...FEW_SHOT_EXAMPLES,
        ...conversationHistory,
        { role: 'user', content: text },
      ];
      console.log('Using history', messages.length);
    } else {
      // Start a new conversation
      messages = [
        SYSTEM_PROMPT,
        ...FEW_SHOT_EXAMPLES,
        { role: 'user', content: text },
      ];
      console.log('Not using history', messages.length, messages);
    }

    // Call OpenAI with retry logic
    const result = await callOpenAIWithRetry(text, messages);

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error processing text-to-color:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 },
    );
  }
}
