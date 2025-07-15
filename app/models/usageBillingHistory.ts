import prisma from "../db.server";

/**
 * Interface representing a single usage billing history record.
 */
interface UsageBillingHistory {
  id: string;
  shop: string;
  totalPrice: number;
  itemsCount: number;
  createdAt: Date;
}

/**
 * Creates a new usage billing history record for a specific shop.
 *
 * @param shop - The shop domain.
 * @param totalPrice - Total price billed (in EUR).
 * @param itemsCount - Number of customized items billed.
 * @returns The created UsageBillingHistory record.
 */
export async function createUsageBillingHistoryForShop(
  shop: string,
  totalPrice: number,
  itemsCount: number
): Promise<UsageBillingHistory> {
  return await prisma.usageBillingHistory.create({
    data: {
      shop,
      totalPrice,
      itemsCount,
    },
  });
}
