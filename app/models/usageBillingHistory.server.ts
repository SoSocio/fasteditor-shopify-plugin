import prisma from "../db.server";

/**
 * Interface representing a usage billing history record for a shop.
 */
interface UsageBillingHistoryServer {
  id: string;
  shop: string;
  totalPrice: number;
  itemsCount: number;
  createdAt: Date;
}

/**
 * Creates a new usage billing history record for a shop.
 *
 * @param shop - The shop domain.
 * @param totalPrice - The total amount billed in EUR.
 * @param itemsCount - The number of order items customized via FastEditor.
 * @returns The created UsageBillingHistory record.
 */
export async function createUsageBillingHistoryForShop(
  shop: string,
  totalPrice: number,
  itemsCount: number
): Promise<UsageBillingHistoryServer> {
  return await prisma.usageBillingHistory.create({
    data: {
      shop,
      totalPrice,
      itemsCount,
    },
  });
}

/**
 * Deletes all usage billing history records for a given shop.
 *
 * @param shop - The shop domain
 * @returns Promise resolving to the result of the deletion operation
 */
export async function deleteUsageBillingHistoryForShop(
  shop: string
): Promise<any> {
  return await prisma.usageBillingHistory.deleteMany({where: {shop}});
}
