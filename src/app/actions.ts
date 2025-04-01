'use server';

import { cookies } from 'next/headers';
import {
  ensureSession,
  recordColorRequest,
  findExistingColorRequest,
} from '@/lib/db-utils';
import { generateColorFromText } from '@/lib/openai-service';
import type { ChatMessage } from '@/lib/openai-service';

export async function getColorFromText(
  text: string,
  keepHistory: boolean,
  conversationHistory: ChatMessage[] = [],
) {
  if (!text) {
    return { error: 'Text is required', color: '#1f1f1f' };
  }

  try {
    // Get session ID from cookies
    const sessionCookie = (await cookies()).get('session')?.value;

    if (!sessionCookie) {
      return { error: 'Session cookie is required', color: '#1f1f1f' };
    }

    // Ensure session exists in database (no request needed now)
    await ensureSession(sessionCookie);

    let result;
    let fromCache = false;
    const utilizeCache = !keepHistory;

    if (utilizeCache) {
      // Try to find the result in the cache
      const cachedResult = await findExistingColorRequest(text);

      if (cachedResult) {
        // Cache hit - use the cached result
        result = cachedResult;
        fromCache = true;
      }
    }

    // If we don't have a result from the cache, call OpenAI
    if (!result) {
      console.log('Calling OpenAI for text:', text);
      result = await generateColorFromText(
        text,
        conversationHistory,
        keepHistory,
      );

      // Only store in the database if this is not a conversation-based query
      if (utilizeCache) {
        // Store the request in the database for future cache hits
        await recordColorRequest(
          sessionCookie,
          text,
          result.color,
          result.rawOutput,
        );
      }
    }

    // Return the result
    return {
      color: result.color,
      rawOutput: result.rawOutput,
      fromCache,
    };
  } catch (error) {
    console.error('Error processing text-to-color:', error);
    return {
      error: error instanceof Error ? error.message : 'Unknown error',
      color: '#1f1f1f',
    };
  }
}
