/**
 * Clerk User Resolution Utility
 *
 * Default Clerk session JWT tokens verified with `verifyToken` only include standard
 * claims (sub, iss, sid, exp, etc.) and omit email addresses unless custom JWT templates
 * are configured in the Clerk Dashboard.
 *
 * This utility resolves the user's primary email address and role from Clerk's User API
 * (https://api.clerk.com/v1/users/{userId}) and caches the result in-memory with a TTL.
 */

interface CachedClerkUser {
  email: string;
  role?: string;
  name?: string;
  expiresAt: number;
}

const clerkUserCache = new Map<string, CachedClerkUser>();

export async function resolveClerkUser(
  userId: string,
  secretKey?: string
): Promise<{ email: string; role?: string; name?: string } | null> {
  const clerkSecretKey = secretKey || process.env.CLERK_SECRET_KEY;
  if (!clerkSecretKey) {
    console.warn(`[clerkUser] Cannot resolve Clerk user ${userId}: CLERK_SECRET_KEY is not set.`);
    return null;
  }

  const cached = clerkUserCache.get(userId);
  if (cached && cached.expiresAt > Date.now()) {
    return { email: cached.email, role: cached.role, name: cached.name };
  }

  try {
    const res = await fetch(`https://api.clerk.com/v1/users/${userId}`, {
      headers: {
        Authorization: `Bearer ${clerkSecretKey}`,
        "Content-Type": "application/json",
      },
    });

    if (!res.ok) {
      console.warn(`[clerkUser] Clerk API user lookup returned status ${res.status} for ${userId}`);
      return null;
    }

    const data = await res.json();
    const primaryId = data.primary_email_address_id;
    const primaryObj = data.email_addresses?.find(
      (e: { id: string; email_address: string }) => e.id === primaryId
    );
    const email = primaryObj?.email_address || data.email_addresses?.[0]?.email_address;

    // Check both public_metadata and unsafe_metadata for role
    const rawRole = (data.public_metadata?.role || data.unsafe_metadata?.role) as string | undefined;
    const role = rawRole ? rawRole.toUpperCase() : undefined;

    const firstName = data.first_name?.trim();
    const lastName = data.last_name?.trim();
    const name = firstName && lastName ? `${firstName} ${lastName}` : firstName || undefined;

    if (email) {
      const entry: CachedClerkUser = {
        email,
        role,
        name,
        expiresAt: Date.now() + 1000 * 60 * 15, // 15-minute cache
      };
      clerkUserCache.set(userId, entry);
      console.log(`[clerkUser] Successfully resolved Clerk user ${userId} -> email: ${email}, role: ${role || 'none'}`);
      return { email, role, name };
    }
  } catch (err) {
    console.error(`[clerkUser] Error fetching Clerk user ${userId}:`, err);
  }

  return null;
}
