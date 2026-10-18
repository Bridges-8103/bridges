import { cache } from "react";
import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { ForbiddenError, UnauthorizedError } from "@/lib/errors";

export interface AdminAccess {
  isSignedIn: boolean;
  isAdmin: boolean;
  email?: string;
}

/**
 * Resolves whether the signed-in Clerk user is an admin.
 *
 * Admin is granted by Clerk `publicMetadata.role = "ADMIN"` (only settable from the Clerk
 * dashboard / backend API) or by a database User with role ADMIN for the primary email.
 * `unsafeMetadata` is deliberately ignored because end users can edit it themselves.
 */
export const getAdminAccess = cache(async (): Promise<AdminAccess> => {
  const user = await currentUser();
  if (!user) return { isSignedIn: false, isAdmin: false };

  const email = user.primaryEmailAddress?.emailAddress;
  const metadataRole = user.publicMetadata?.role;
  if (typeof metadataRole === "string" && metadataRole.toUpperCase() === "ADMIN") {
    return { isSignedIn: true, isAdmin: true, email };
  }

  if (email) {
    const dbAdmin = await prisma.user.findFirst({
      where: { email, role: "ADMIN" },
      select: { id: true },
    });
    if (dbAdmin) return { isSignedIn: true, isAdmin: true, email };
  }

  return { isSignedIn: true, isAdmin: false, email };
});

/**
 * Guard for server actions: throws unless the caller is an admin.
 */
export async function requireAdmin(): Promise<AdminAccess> {
  const access = await getAdminAccess();
  if (!access.isSignedIn) throw new UnauthorizedError("Sign in to continue.");
  if (!access.isAdmin) throw new ForbiddenError("Admin access is required.");
  return access;
}

/**
 * Guard for dashboard pages: redirects non-admins to the access-denied screen.
 */
export async function requireAdminPage(): Promise<AdminAccess> {
  const access = await getAdminAccess();
  if (!access.isAdmin) redirect("/dashboard/access-denied");
  return access;
}
