import axios from "axios";
import dotenv from "dotenv";

dotenv.config();

console.log("[messengerClient] MESSENGER_API_URL=", process.env.MESSENGER_API_URL);

const messenger = axios.create({
  baseURL:
    process.env.MESSENGER_API_URL ||
    "http://localhost:3000",

  timeout: 15000,

  headers: {
    "Content-Type": "application/json",
  },
});

const getMessengerHeaders = () => {
  const apiKey = process.env.MESSENGER_API_KEY || "";
  const headers = {};

  if (apiKey) {
    headers["x-api-key"] = apiKey;
    headers.Authorization = `Bearer ${apiKey}`;
  }

  return headers;
};

/* -------------------------------------------------------
   GENERIC MESSAGE SENDER
------------------------------------------------------- */

export const sendMessage = async ({
  channel,
  to,
  subject,
  body,
  payload = null,
  metadata = {},
  from,
  scheduledAt,
  externalId,
  idempotencyKey,
  dlt_template_id,
  dlt_entity_id,
  sender_id,
  last_user_message_at,
  is_template,
}) => {
  try {
    const requestBody = {
      channel,
      to,
    };

    if (from) requestBody.from = from;

    if (subject) requestBody.subject = subject;

    const hasBody = typeof body === "string" ? body.trim().length > 0 : body !== undefined && body !== null;
    if (hasBody) requestBody.body = body;

    const hasPayload = payload !== undefined && payload !== null && !(typeof payload === "string" && payload.trim().length === 0);
    if (hasPayload) requestBody.payload = payload;

    if (metadata !== undefined && metadata !== null) requestBody.metadata = metadata;

    if (scheduledAt) requestBody.scheduledAt = scheduledAt;

    if (externalId) requestBody.externalId = externalId;

    if (idempotencyKey) requestBody.idempotencyKey = idempotencyKey;

    if (dlt_template_id) requestBody.dlt_template_id = dlt_template_id;
    if (dlt_entity_id) requestBody.dlt_entity_id = dlt_entity_id;
    if (sender_id) requestBody.sender_id = sender_id;
    if (last_user_message_at) requestBody.last_user_message_at = last_user_message_at;
    if (typeof is_template === "boolean") requestBody.is_template = is_template;

    const response =
      await messenger.post(
        "/v1/messages",
        requestBody,
        { headers: getMessengerHeaders() }
      );

    console.log("Messenger forwarded response:", response.status, response.data);

    return {
      success: true,
      data: response.data?.data ?? response.data,
    };
  } catch (error) {
    console.error(
      "Messenger API Error:",
      error.response?.data ||
        error.message
    );
    console.error(error);

    return {
      success: false,
      error:
        error.response?.data ||
        error.message,
    };
  }
};

/* -------------------------------------------------------
   EMAIL
------------------------------------------------------- */

export const listMessages = async ({ page = 1, limit = 20 } = {}) => {
  try {
    const response = await messenger.get("/v1/messages", {
      headers: getMessengerHeaders(),
      params: { page, limit },
    });

    return {
      success: true,
      data: response.data?.data ?? [],
      page: response.data?.page ?? page,
      limit: response.data?.limit ?? limit,
    };
  } catch (error) {
    console.error(
      "Messenger list messages error:",
      error.response?.data || error.message
    );
    console.error(error);

    return {
      success: false,
      error: error.response?.data || error.message,
      page,
      limit,
    };
  }
};

export const getMessageById = async (id) => {
  try {
    const response = await messenger.get(`/v1/messages/${id}`, { headers: getMessengerHeaders() });

    return {
      success: true,
      data: response.data?.data ?? null,
    };
  } catch (error) {
    console.error(
      "Messenger get message error:",
      error.response?.data || error.message
    );
    console.error(error);

    return {
      success: false,
      error: error.response?.data || error.message,
    };
  }
};

export const cancelMessage = async (id) => {
  try {
    const response = await messenger.delete(`/v1/messages/${id}`, { headers: getMessengerHeaders() });

    return {
      success: true,
      data: response.data?.data ?? response.data,
    };
  } catch (error) {
    console.error("Messenger cancel message error:", error.response?.data || error.message);
    console.error(error);

    return {
      success: false,
      error: error.response?.data || error.message,
    };
  }
};

export const sendEmail = async ({
  to,
  subject,
  body,
  metadata = {},
  payload = null,
  ...rest
}) => {
  return sendMessage({
    channel: "EMAIL",
    to,
    subject,
    body,
    payload,
    metadata,
    ...rest,
  });
};

/* -------------------------------------------------------
   SMS
------------------------------------------------------- */

export const sendSMS = async ({
  to,
  body,
  metadata = {},
  payload = null,
  ...rest
}) => {
  return sendMessage({
    channel: "SMS",
    to,
    body,
    payload,
    metadata,
    ...rest,
  });
};

/* -------------------------------------------------------
   WHATSAPP
------------------------------------------------------- */

export const sendWhatsApp =
  async ({
    to,
    body,
    metadata = {},
    payload = null,
    ...rest
  }) => {
    return sendMessage({
      channel: "WHATSAPP",
      to,
      body,
      payload,
      metadata,
      ...rest,
    });
  };

/* -------------------------------------------------------
   VOICE (Future)
------------------------------------------------------- */

export const sendVoice =
  async ({
    to,
    body,
    metadata = {},
    payload = null,
    ...rest
  }) => {
    return sendMessage({
      channel: "VOICE",
      to,
      body,
      payload,
      metadata,
      ...rest,
    });
  };

export default {
  sendMessage,
  sendEmail,
  sendSMS,
  sendWhatsApp,
  sendVoice,
  cancelMessage,
};