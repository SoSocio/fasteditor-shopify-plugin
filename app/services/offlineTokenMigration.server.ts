import {shopifyApi} from "@shopify/shopify-api";
import prisma from "../db.server";
import {apiVersion, sessionStorage} from "../shopify.server";

const tokenApi = shopifyApi({
  apiKey: process.env.SHOPIFY_API_KEY,
  apiSecretKey: process.env.SHOPIFY_API_SECRET || "",
  apiVersion,
  scopes: process.env.SCOPES?.split(","),
  hostName: new URL(process.env.SHOPIFY_APP_URL || "http://localhost").host,
  isEmbeddedApp: true,
});

export interface OfflineTokenMigrationResult {
  attempted: number;
  migrated: string[];
  failed: Array<{shop: string; error: string}>;
  skipped: string[];
}

/**
 * Exchanges legacy non-expiring offline tokens for expiring, refreshable ones.
 *
 * The migration is idempotent at the database level: sessions that already
 * have a refresh token are never selected again. Shopify revokes each legacy
 * token after a successful exchange, so callers should run this only after the
 * schema migration and expiring-token SDK configuration are deployed.
 */
export async function migrateLegacyOfflineTokens({
  dryRun = false,
  limit,
}: {
  dryRun?: boolean;
  limit?: number;
} = {}): Promise<OfflineTokenMigrationResult> {
  const sessions = await prisma.session.findMany({
    where: {
      isOnline: false,
      expires: null,
      refreshToken: null,
    },
    orderBy: {shop: "asc"},
    ...(limit === undefined ? {} : {take: limit}),
  });

  const result: OfflineTokenMigrationResult = {
    attempted: sessions.length,
    migrated: [],
    failed: [],
    skipped: [],
  };

  for (const session of sessions) {
    if (!session.accessToken) {
      result.skipped.push(session.shop);
      continue;
    }

    if (dryRun) {
      result.skipped.push(session.shop);
      continue;
    }

    try {
      const {session: migratedSession} =
        await tokenApi.auth.migrateToExpiringToken({
          shop: session.shop,
          nonExpiringOfflineAccessToken: session.accessToken,
        });

      await sessionStorage.storeSession(migratedSession);
      result.migrated.push(session.shop);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error("[offline-token-migration] Failed to migrate shop", {
        shop: session.shop,
        error: message,
      });
      result.failed.push({shop: session.shop, error: message});
    }
  }

  return result;
}
