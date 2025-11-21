import type { ActionFunctionArgs } from "@remix-run/node";
import { authenticate } from "../shopify.server";
import { upsertMerchant } from "../models/merchant.server";
import i18n from "../i18n";

/**
 * Interface for the action response
 */
interface ActionResponse {
  success: boolean;
  language?: string;
  error?: string;
}

/**
 * Action handler for updating merchant language preference.
 * Updates the language in the Merchant table for the authenticated user.
 *
 * @param request - The incoming request object
 * @returns JSON response with success status and updated language
 */
export const action = async ({
  request,
}: ActionFunctionArgs): Promise<Response> => {
  try {
    const { session } = await authenticate.admin(request);
    const formData = await request.formData();
    const language = formData.get("language") as string;
    console.log("language", language);

    // Validate language
    if (!language || !i18n.supportedLngs.includes(language)) {
      console.log("Invalid language selection", language);
      return Response.json(
        {
          success: false,
          error: "Invalid language selection",
        } satisfies ActionResponse,
        { status: 400 }
      );
    }

    // Get userId from session
    const userId = session.onlineAccessInfo?.associated_user.id;

    if (!userId) {
      console.log("User ID not found in session", userId);
      return Response.json(
        {
          success: false,
          error: "User ID not found in session",
        } satisfies ActionResponse,
        { status: 400 }
      );
    }

    // Update merchant language in database
    const test = await upsertMerchant(String(userId), session.shop, language);
    console.log("test", test);
    console.log(
      `[app.language.update] Language updated for userId: ${userId}, shop: ${session.shop}, language: ${language}`
    );

    return Response.json({
      success: true,
      language,
    } satisfies ActionResponse);
  } catch (error) {
    console.error("[app.language.update] Error updating language:", error);

    return Response.json(
      {
        success: false,
        error: "Failed to update language preference",
      } satisfies ActionResponse,
      { status: 500 }
    );
  }
};

