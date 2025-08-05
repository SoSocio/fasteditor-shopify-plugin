import prisma from '../db.server';
import type {ShopifyLineItem, ShopifyOrder} from "../types/order.types";

/**
 * Interface representing an order item that was customized using FastEditor.
 */
export interface FastEditorOrderItem {
  id: string;
  shop: string;
  orderId: string;
  orderName: string;
  lineItemId: string;
  quantity: number;
  unitPrice: number;
  projectKey: number;
  productId: string;
  variantId: string | null;
  usageFee: number;
}

/**
 * Creates a record in the `FastEditorOrderItems` table for an order item customized via FastEditor.
 *
 * @param shop - The shop domain.
 * @param order - The Shopify order object.
 * @param item - The customized line item.
 * @param projectKey - FastEditor project key extracted from item properties.
 * @param usageFee - Commission fee calculated per item (in EUR).
 * @returns Created FastEditorOrderItem or null.
 */
export async function createFastEditorOrderItem(
  shop: string,
  order: ShopifyOrder,
  item: ShopifyLineItem,
  projectKey: string,
  usageFee: number
): Promise<FastEditorOrderItem | null> {
  return await prisma.fastEditorOrderItems.create({
    data: {
      shop,
      orderId: String(order.id),
      orderName: order.name,
      lineItemId: String(item.id),
      quantity: item.quantity,
      unitPrice: parseFloat(item.price),
      projectKey: parseInt(projectKey),
      productId: String(item.product_id),
      variantId: String(item.variant_id),
      usageFee
    },
  });
}

/**
 * Checks if a specific order item customized via FastEditor already exists in the database.
 *
 * @param shop - The shop domain.
 * @param orderId - Shopify order ID.
 * @param lineItemId - Shopify line item ID.
 * @returns True if item exists in DB, false otherwise.
 */
export async function fastEditorOrderItemExists(
  shop: string,
  orderId: string,
  lineItemId: string
): Promise<boolean> {
  const existingItem = await prisma.fastEditorOrderItems.findFirst({
    where: {shop, orderId, lineItemId},
  });

  return !!existingItem;
}

/**
 * Retrieves a list of shops that had order items customized via FastEditor within the last month.
 *
 * @param since - Date from which to start checking.
 * @returns List of distinct shop domains.
 */
export async function findShopsWithFastEditorOrderItemsLastMonth(
  since: Date,
): Promise<{ shop: string }[]> {
  return await prisma.fastEditorOrderItems.findMany({
    where: {
      createdAt: {gte: since}
    },
    select: {shop: true},
    distinct: ['shop'],
  });
}

/**
 * Retrieves all unbilled order items customized via FastEditor for a specific shop from the last
 * month.
 *
 * @param shop - The shop domain.
 * @param since - Date from which to start checking.
 * @returns Array of unbilled order item records.
 */
export async function findUnbilledFastEditorOrderItemsLastMonth(
  shop: string,
  since: Date,
): Promise<FastEditorOrderItem[]> {
  return await prisma.fastEditorOrderItems.findMany({
    where: {
      shop,
      createdAt: {gte: since},
      billed: false,
    },
  });
}

/**
 * Marks all unbilled order items customized via FastEditor for a given shop as billed.
 *
 * @param shop - The shop domain.
 * @param since - Date from which to start checking.
 * @returns The number of updated order items.
 */
export async function updateUnbilledFastEditorOrderItemsLastMonth(
  shop: string,
  since: Date,
): Promise<number> {
  const result = await prisma.fastEditorOrderItems.updateMany({
    where: {
      shop,
      createdAt: {gte: since},
      billed: false,
    },
    data: {
      billed: true,
      billedAt: new Date(),
    },
  });

  return result.count;
}

/**
 * Deletes all FastEditor order item records associated with the given shop.
 *
 * @param shop - The shop domain
 * @returns Promise resolving to the result of the delete operation
 */
export async function deleteFastEditorOrderItemsFoShop(
  shop: string
): Promise<any> {
  return await prisma.fastEditorOrderItems.deleteMany({where: {shop}});
}
