import type {ActionFunctionArgs} from "@remix-run/node";
import {authenticate} from "../shopify.server";
import {updateSessionScopes} from "../models/session.server";

export const action = async ({request}: ActionFunctionArgs) => {
  const {payload, session, topic, shop} = await authenticate.webhook(request);
  console.log(`Received ${topic} webhook for ${shop}`);

  const current = payload.current as string[];

  if (session) {
    await updateSessionScopes(session.id, current.toString())
  }
  return new Response();
};
