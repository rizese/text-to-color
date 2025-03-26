import { NextResponse } from 'next/server';
import { NextRequest } from 'next/server';
import {
  ensureSession,
  recordColorRequest,
  findExistingColorRequest,
} from '@/lib/db-utils';
import { generateColorFromText, extractReasoning } from '@/lib/openai-service';

export async function POST(request: NextRequest) {
  try {
    // Parse the request body
    const body = await request.json();
    const { text, conversationHistory = [], keepHistory = false } = body;

    if (!text) {
      return NextResponse.json({ error: 'Text is required' }, { status: 400 });
    }

    // Get session ID from cookies
    const sessionCookie = request.cookies.get('session')?.value;
    if (!sessionCookie) {
      return NextResponse.json(
        { error: 'Session cookie is required' },
        { status: 400 },
      );
    }

    // Ensure session exists in database
    await ensureSession(sessionCookie, request);

    let result;
    let fromCache = false;

    // Check if we should use the cache
    // Skip cache if conversation history is being used
    if (!keepHistory && conversationHistory.length === 0) {
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
      if (!keepHistory && conversationHistory.length === 0) {
        const reasoning = extractReasoning(result.rawOutput);

        // Store the request in the database for future cache hits
        await recordColorRequest(
          sessionCookie,
          text,
          result.color,
          result.imagery,
          reasoning,
          request,
        );
      }
    }

    // Include cache status in the response for debugging
    return NextResponse.json({
      ...result,
      fromCache,
    });
  } catch (error) {
    console.error('Error processing text-to-color:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 },
    );
  }
}
