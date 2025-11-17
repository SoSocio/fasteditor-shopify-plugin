import prisma from '../db.server';

/**
 * Interface representing a merchant record.
 */
export interface Merchant {
  id: string;
  userId: string;
  shop: string;
  language: string | null;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Creates or updates a merchant record.
 * If a merchant with the same userId and shop exists, updates the language and updatedAt.
 * Otherwise, creates a new merchant record.
 *
 * @param userId - Shopify user ID
 * @param shop - Shopify shop domain
 * @param language - Merchant's preferred language
 * @returns Created or updated Merchant record
 */
export async function upsertMerchant(
  userId: string,
  shop: string,
  language: string | null
): Promise<Merchant> {
  return await prisma.merchant.upsert({
    where: {
      userId_shop: {
        userId,
        shop,
      },
    },
    update: {
      language,
      updatedAt: new Date(),
    },
    create: {
      userId,
      shop,
      language,
    },
  });
}

/**
 * Retrieves a merchant by userId and shop.
 *
 * @param userId - Shopify user ID
 * @param shop - Shopify shop domain
 * @returns Merchant record or null if not found
 */
export async function getMerchant(
  userId: string,
  shop: string
): Promise<Merchant | null> {
  return await prisma.merchant.findUnique({
    where: {
      userId_shop: {
        userId,
        shop,
      },
    },
  });
}

/**
 * Retrieves all merchants for a specific shop.
 *
 * @param shop - Shopify shop domain
 * @returns Array of Merchant records
 */
export async function getMerchantsByShop(shop: string): Promise<Merchant[]> {
  return await prisma.merchant.findMany({
    where: { shop },
    orderBy: { createdAt: 'desc' },
  });
}

/**
 * Retrieves all merchants for a specific user.
 *
 * @param userId - Shopify user ID
 * @returns Array of Merchant records
 */
export async function getMerchantsByUser(userId: string): Promise<Merchant[]> {
  return await prisma.merchant.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
  });
}

/**
 * Creates a new merchant record.
 * Throws an error if a merchant with the same userId and shop already exists.
 *
 * @param userId - Shopify user ID
 * @param shop - Shopify shop domain
 * @param language - Merchant's preferred language
 * @returns Created Merchant record
 * @throws Error if merchant already exists
 */
export async function createMerchant(
  userId: string,
  shop: string,
  language: string | null
): Promise<Merchant> {
  return await prisma.merchant.create({
    data: {
      userId,
      shop,
      language,
    },
  });
}

/**
 * Updates an existing merchant's language.
 * Throws an error if merchant doesn't exist.
 *
 * @param userId - Shopify user ID
 * @param shop - Shopify shop domain
 * @param language - New preferred language
 * @returns Updated Merchant record
 * @throws Error if merchant doesn't exist
 */
export async function updateMerchantLanguage(
  userId: string,
  shop: string,
  language: string | null
): Promise<Merchant> {
  return await prisma.merchant.update({
    where: {
      userId_shop: {
        userId,
        shop,
      },
    },
    data: {
      language,
      updatedAt: new Date(),
    },
  });
}



