import { Session } from "@prisma/client";
import { Session as ShopifySession } from "@shopify/shopify-api";
import prisma from "./prisma-connect";

// Get API key from environment with fallback
const apiKey = process.env.SHOPIFY_API_KEY || "49e6ec7fb69ed11a4e11f2d7231d6ea5";

/**
 * Stores the session in the database
 * This could be usedful if we need to do something with the
 * access token later
 */
export async function storeSession(session: ShopifySession): Promise<boolean> {
  console.log('➡️ [DB Session Storage] storeSession CALLED with session ID:', session.id, 'Shop:', session.shop);
  try {
    const storedSession = await prisma.session.upsert({
      where: { id: session.id },
      update: {
        shop: session.shop,
        state: session.state,
        isOnline: session.isOnline,
        accessToken: session.accessToken,
        expires: session.expires,
        scope: session.scope,
        apiKey: apiKey,
      },
      create: {
        id: session.id,
        shop: session.shop,
        state: session.state,
        isOnline: session.isOnline,
        accessToken: session.accessToken,
        expires: session.expires,
        scope: session.scope,
        apiKey: apiKey,
      },
    });
    console.log('✅ [DB Session Storage] storeSession SUCCEEDED for session ID:', session.id, 'DB ID:', storedSession.id);
    return true;
  } catch (error: any) {
    console.error('❌ [DB Session Storage] storeSession FAILED for session ID:', session.id, 'Error:', error.message, error.stack);
    // Depending on how shopify-api handles this, you might re-throw or return false
    // For now, let's return false as per the interface suggestion for custom stores
    return false;
  }
}

/**
 * Loads the session from the database
 */
export async function loadSession(id: string): Promise<ShopifySession | undefined> {
  console.log('➡️ [DB Session Storage] loadSession CALLED with ID:', id);
  try {
    const session = await prisma.session.findUnique({ where: { id } });
    if (!session) {
      console.log('🔶 [DB Session Storage] loadSession: No session found for ID:', id);
      return undefined;
    }
    console.log('✅ [DB Session Storage] loadSession SUCCEEDED for ID:', id);
    // Transform Prisma session to ShopifySession
    return new ShopifySession(session as any); // You might need to map fields if names differ
  } catch (error: any) {
    console.error('❌ [DB Session Storage] loadSession FAILED for ID:', id, 'Error:', error.message, error.stack);
    return undefined;
  }
}

/**
 * Deletes the session from the database
 */
export async function deleteSession(id: string): Promise<boolean> {
  console.log('➡️ [DB Session Storage] deleteSession CALLED with ID:', id);
  try {
    await prisma.session.delete({ where: { id } });
    console.log('✅ [DB Session Storage] deleteSession SUCCEEDED for ID:', id);
    return true;
  } catch (error: any) {
    console.error('❌ [DB Session Storage] deleteSession FAILED for ID:', id, 'Error:', error.message, error.stack);
    return false;
  }
}

export async function deleteSessions(ids: string[]) {
  await prisma.session.deleteMany({
    where: { id: { in: ids } },
  });
}

export async function cleanUpSession(shop: string, accessToken: string) {
  await prisma.session.deleteMany({
    where: { shop, accessToken, apiKey },
  });
}

export async function findSessionsByShop(shop: string): Promise<ShopifySession[]> {
  console.log('➡️ [DB Session Storage] findSessionsByShop CALLED for shop:', shop, 'using apiKey:', apiKey);
  try {
    const sessions = await prisma.session.findMany({
      where: { shop, apiKey }, // Ensure apiKey is part of the query if it's part of the uniqueness/filtering
    });
    console.log(`✅ [DB Session Storage] findSessionsByShop found ${sessions.length} sessions for shop: ${shop}`);
    return sessions.map((session) => new ShopifySession(session as any)); // Map to ShopifySession
  } catch (error: any) {
    console.error('❌ [DB Session Storage] findSessionsByShop FAILED for shop:', shop, 'Error:', error.message, error.stack);
    return [];
  }
}

function generateShopifySessionFromDB(session: Session) {
  return new ShopifySession({
    id: session.id,
    shop: session.shop,
    accessToken: session.accessToken || undefined,
    scope: session.scope || undefined,
    state: session.state,
    isOnline: session.isOnline,
    expires: session.expires || undefined,
  });
}

export class SessionNotFoundError extends Error {
  constructor() {
    super("Session not found");
    this.name = "SessionNotFoundError";
  }
}
