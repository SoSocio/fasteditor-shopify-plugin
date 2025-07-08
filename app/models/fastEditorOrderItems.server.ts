import prisma from '../db.server';
import type {ShopifyLineItem, ShopifyOrder} from "../types/shopify";

/**
 * Interface representing a FastEditor processed order item.
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
 * Creates a record in `FastEditorOrderItems` table for a customized item.
 * @param shop - The shop domain.
 * @param order - The Shopify order object.
 * @param item - The customized line item.
 * @param projectKey - FastEditor project key extracted from item properties.
 * @param usageFee - Commission fee calculated per item (in EUR)..
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
 * Checks if a FastEditor order already exists in the database.
 * @param shop - Shopify shop domain.
 * @param orderId - Shopify order ID.
 * @param lineItemId - Shopify line item ID.
 * @returns True if item exists in DB, false otherwise.
 */
export async function fastEditorOrderItemExists(
  shop: string,
  orderId: string,
  lineItemId: string
): Promise<boolean> {
  const existing = await prisma.fastEditorOrderItems.findFirst({
    where: {shop, orderId, lineItemId},
  });

  return !!existing;
}
