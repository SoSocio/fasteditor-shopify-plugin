import prisma from "../db.server";

/**
 * Response structure for a session retrieved from the database.
 */
export interface SessionResponse {
  id: string;
  shop: string;
  state: string;
  isOnline: boolean;
  scope: string | null;
  expires: Date | null;
  accessToken: string;
  userId: bigint | null;
  firstName: string | null;
  lastName: string | null;
  email: string | null;
  accountOwner: boolean;
  locale: string | null;
  collaborator: boolean | null;
  emailVerified: boolean | null;
}

/**
 * Retrieves the first available session for the given shop.
 *
 * @param shop - The shop domain.
 * @returns The session object if found, otherwise null.
 */
export async function getSessionForShop(shop: string): Promise<SessionResponse | null> {
  const session = await prisma.session.findFirst({
    where: {shop},
  });

  return session ?? null;
}

/**
 * Updates the OAuth scope value for a specific session.
 *
 * @param id - The ID of the session to update.
 * @param scope - The new scope string.
 * @returns The updated session object.
 */
export async function updateSessionScopes(id: string, scope: string): Promise<SessionResponse> {
  return await prisma.session.update({
    where: {id},
    data: {
      scope
    },
  });
}

/**
 * Deletes all sessions associated with a given shop domain.
 *
 * @param shop - The shop domain.
 * @returns The number of sessions deleted.
 */
export async function deleteShopFromSession(shop: string): Promise<number> {
  const deleted = await prisma.session.deleteMany({
    where: {shop},
  });

  return deleted.count;
}
