import { prisma } from './prisma';
import { NextRequest } from 'next/server';
import { ColorResult } from './openai-service';

/**
 * Ensures a session exists in the database
 * @param sessionId The session ID from the cookie
 * @param req The Next.js request object
 * @returns The session ID
 */
export async function ensureSession(
  sessionId: string,
  req: NextRequest,
): Promise<string> {
  // Get IP address if available
  const ipAddress = getIpAddress(req);

  // Check if session exists
  const existingSession = await prisma.session.findUnique({
    where: { id: sessionId },
  });

  if (!existingSession) {
    // Create new session
    await prisma.session.create({
      data: {
        id: sessionId,
        ipAddress,
      },
    });
  }

  return sessionId;
}

/**
 * Records a color request in the database
 * @param sessionId The session ID
 * @param inputText The input text
 * @param hexColor The generated hex color
 * @param rawOutput The raw output from the LLM
 */
export async function recordColorRequest(
  sessionId: string,
  inputText: string,
  hexColor: string,
  rawOutput: string,
): Promise<void> {
  await prisma.colorRequest.create({
    data: {
      sessionId,
      inputText,
      hexColor,
      rawOutput,
    },
  });
}

/**
 * Finds an existing color request for the given input text
 * @param inputText The input text to search for
 * @returns The color result if found, null otherwise
 */
export async function findExistingColorRequest(
  inputText: string,
): Promise<ColorResult | null> {
  console.log(`Checking cache for: ${inputText}`);
  // Normalize input text (trim whitespace, convert to lowercase)
  const normalizedText = inputText.trim().toLowerCase();

  // Find an exact match (case-insensitive)
  const existingRequest = await prisma.colorRequest.findFirst({
    where: {
      inputText: {
        equals: normalizedText,
        mode: 'insensitive', // Case-insensitive match
      },
    },
    orderBy: {
      createdAt: 'desc', // Get the most recent match if multiple exist
    },
  });

  if (existingRequest) {
    console.log(`Cache hit for input: "${inputText}"`);

    // Format the result to match the ColorResult interface
    return {
      color: existingRequest.hexColor,
      rawOutput: existingRequest.rawOutput,
    };
  }

  console.log(`Cache miss for input: "${inputText}"`);
  return null;
}

/**
 * Extracts the IP address from the request
 * @param req The Next.js request object
 * @returns The IP address or null if not available
 */
function getIpAddress(req: NextRequest): string | null {
  // Try to get IP from X-Forwarded-For header (common for proxies)
  const forwardedFor = req.headers.get('x-forwarded-for');
  if (forwardedFor) {
    // X-Forwarded-For can contain multiple IPs, take the first one
    const ips = forwardedFor.split(',');
    return ips[0].trim();
  }

  // Try to get from other common headers
  const realIp = req.headers.get('x-real-ip');
  if (realIp) {
    return realIp.trim();
  }

  // If running locally or can't determine IP
  return null;
}
