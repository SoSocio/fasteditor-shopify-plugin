import prisma from '../db.server';
import type {ShopSettingsCore} from "../types/shop.types";

/**
 * Interface representing the FastEditor settings for a specific shop.
 */
export interface ShopSettings extends ShopSettingsCore {
  id: string;
  shop: string;
  shopifySubscriptionId: string | null;
  subscriptionStatus: string | null;
  subscriptionCurrentPeriodEnd: Date | null;
  trialStartDate: Date | null;
  trialEndDate: Date | null;
  fastEditorApiKey: string | null;
  fastEditorDomain: string | null;
  language: string | null;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Input data for batch subscription state updates from webhooks or API sync.
 * All fields are nullable to allow partial updates.
 */
export interface SubscriptionStateInput {
  subscriptionId: string | null;
  subscriptionStatus: string | null;
  subscriptionCurrentPeriodEnd: Date | null;
  trialStartDate: Date | null;
  trialEndDate: Date | null;
}

/**
 * Retrieves shop settings for a specific shop domain.
 *
 * @param shop - The shop domain (e.g., "example.myshopify.com")
 * @returns Shop settings or null if not found
 */
export async function getShopSettings(shop: string): Promise<ShopSettings | null> {
  return await prisma.shopSettings.findUnique({
    where: {shop},
  });
}

/**
 * Creates a new shop settings record with initial subscription and localization data.
 * Used during shop onboarding to establish baseline configuration.
 *
 * @param shop - The shop domain
 * @param shopifySubscriptionId - Shopify subscription identifier
 * @param subscriptionStatus - Current subscription status
 * @param subscriptionCurrentPeriodEnd - End date of current billing period
 * @param trialStartDate - When the trial period began
 * @param trialEndDate - When the trial period ends
 * @param language - Primary shop language code
 * @param countryCode - Shop's country code
 * @param currency - Shop's currency code
 * @returns Created ShopSettings record
 */
export async function createShopSettings(
  shop: string,
  shopifySubscriptionId: string,
  subscriptionStatus: string,
  subscriptionCurrentPeriodEnd: Date,
  trialStartDate: Date,
  trialEndDate: Date | null,
  language: string,
  countryCode: string,
  currency: string
): Promise<ShopSettings> {
  return await prisma.shopSettings.create({
    data: {
      shop,
      shopifySubscriptionId,
      subscriptionStatus,
      subscriptionCurrentPeriodEnd,
      trialStartDate,
      trialEndDate,
      fastEditorApiKey: null,
      fastEditorDomain: null,
      language,
      country: countryCode,
      currency
    },
  });
}

/**
 * Deletes shop settings for a given shop domain.
 * Typically used during app uninstall or data cleanup operations.
 *
 * @param shop - The shop domain
 * @returns Deleted ShopSettings record
 */
export async function deleteShopSettings(shop: string): Promise<ShopSettings> {
  return await prisma.shopSettings.delete({where: {shop}});
}

/**
 * Updates core subscription fields (ID, status, period end) for an existing shop.
 * Does not modify trial dates or FastEditor integration settings.
 *
 * @param shop - The shop domain
 * @param subscriptionId - Shopify subscription identifier
 * @param status - Current subscription status
 * @param currentPeriodEnd - End date of current billing period
 * @returns Updated ShopSettings record
 * @throws Error if shop settings do not exist
 */
export async function updateSubscriptionShopSettings(
  shop: string,
  subscriptionId: string | null,
  status: string | null,
  currentPeriodEnd: Date | null,
): Promise<ShopSettings> {
  return await prisma.shopSettings.update({
    where: {shop},
    data: {
      shopifySubscriptionId: subscriptionId,
      subscriptionStatus: status,
      subscriptionCurrentPeriodEnd: currentPeriodEnd,
    }
  });
}

/**
 * Updates only the subscription status field, leaving all other fields unchanged.
 * Useful for webhooks that need to update status without affecting other data.
 *
 * @param shop - The shop domain
 * @param status - New subscription status
 * @returns Updated ShopSettings record
 * @throws Error if shop settings do not exist
 */
export async function updateShopSubscriptionStatus(
  shop: string,
  status: string | null
): Promise<ShopSettings> {
  return await prisma.shopSettings.update({
    where: {shop},
    data: {subscriptionStatus: status},
  });
}

/**
 * Updates FastEditor integration credentials for an existing shop.
 * Does not affect subscription or localization settings.
 *
 * @param shop - The shop domain
 * @param fastEditorApiKey - API key for FastEditor service
 * @param fastEditorDomain - Domain/endpoint for FastEditor service
 * @returns Updated ShopSettings record
 * @throws Error if shop settings do not exist
 */
export async function upsertFastEditorShopSettings(
  shop: string,
  fastEditorApiKey: string,
  fastEditorDomain: string,
): Promise<ShopSettings> {
  return await prisma.shopSettings.update({
    where: {shop},
    data: {
      fastEditorApiKey,
      fastEditorDomain,
    },
  });
}

/**
 * Upserts complete subscription state including trial dates and all subscription fields.
 * Creates shop settings if they don't exist; updates if they do.
 *
 * @param shop - The shop domain
 * @param state - Complete subscription state input object
 * @returns Upserted ShopSettings record
 */
export async function upsertShopSubscriptionState(
  shop: string,
  state: SubscriptionStateInput
): Promise<ShopSettings> {
  return await prisma.shopSettings.upsert({
    where: {shop},
    update: {
      shopifySubscriptionId: state.subscriptionId,
      subscriptionStatus: state.subscriptionStatus,
      subscriptionCurrentPeriodEnd: state.subscriptionCurrentPeriodEnd,
      trialStartDate: state.trialStartDate,
      trialEndDate: state.trialEndDate,
    },
    create: {
      shop,
      shopifySubscriptionId: state.subscriptionId,
      subscriptionStatus: state.subscriptionStatus,
      subscriptionCurrentPeriodEnd: state.subscriptionCurrentPeriodEnd,
      trialStartDate: state.trialStartDate,
      trialEndDate: state.trialEndDate,
      fastEditorApiKey: null,
      fastEditorDomain: null,
      language: null,
      country: null,
      currency: null,
    },
  });
}
