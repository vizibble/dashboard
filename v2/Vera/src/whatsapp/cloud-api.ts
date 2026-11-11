import axios from "axios";

import { env } from "@/config/env";

/** WhatsApp's limit is 4096 characters per text message. */
export const MAX_TEXT_LENGTH = 4000;

export class WhatsappSendError extends Error {
  constructor(
    message: string,
    readonly retryable: boolean,
  ) {
    super(message);
    this.name = "WhatsappSendError";
  }
}

/**
 * Sends a free-form text reply through the official Meta WhatsApp Cloud API. Vera only ever
 * replies to a message the user just sent, which keeps it inside the 24-hour service window.
 */
export async function sendText(to: string, text: string): Promise<string> {
  const config = env();
  const response = await axios.post(
    `${config.WHATSAPP_GRAPH_URL}/${config.WHATSAPP_PHONE_NUMBER_ID}/messages`,
    {
      messaging_product: "whatsapp",
      recipient_type: "individual",
      to,
      type: "text",
      text: { preview_url: false, body: text.slice(0, MAX_TEXT_LENGTH) },
    },
    {
      headers: { authorization: `Bearer ${config.WHATSAPP_ACCESS_TOKEN}` },
      timeout: 10_000,
      validateStatus: () => true,
    },
  );
  if (response.status >= 200 && response.status < 300) {
    return response.data?.messages?.[0]?.id ?? "";
  }
  const retryable = response.status === 429 || response.status >= 500;
  throw new WhatsappSendError(
    `WhatsApp send failed (${response.status}): ${response.data?.error?.message ?? "unknown"}`,
    retryable,
  );
}
