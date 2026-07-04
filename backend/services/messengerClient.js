import axios from "axios";

const messenger = axios.create({
  baseURL:
    process.env.MESSENGER_API_URL ||
    "http://localhost:4000",

  timeout: 15000,

  headers: {
    "Content-Type": "application/json",

    "x-api-key":
      process.env.MESSENGER_API_KEY || "",
  },
});

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
}) => {
  try {
    const requestBody = {
      channel,
      to,
    };

    if (from) requestBody.from = from;

    if (subject) requestBody.subject = subject;

    if (body) requestBody.body = body;

    if (payload) requestBody.payload = payload;

    if (metadata)
      requestBody.metadata = metadata;

    if (scheduledAt)
      requestBody.scheduledAt =
        scheduledAt;

    if (externalId)
      requestBody.externalId =
        externalId;

    const response =
      await messenger.post(
        "/messages",
        requestBody
      );

    return {
      success: true,
      data: response.data,
    };
  } catch (error) {
    console.error(
      "Messenger API Error:",
      error.response?.data ||
        error.message
    );

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

export const sendEmail = async ({
  to,
  subject,
  body,
  metadata = {},
}) => {
  return sendMessage({
    channel: "EMAIL",

    to,

    subject,

    body,

    metadata,
  });
};

/* -------------------------------------------------------
   SMS
------------------------------------------------------- */

export const sendSMS = async ({
  to,
  body,
  metadata = {},
}) => {
  return sendMessage({
    channel: "SMS",

    to,

    body,

    metadata,
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
  }) => {
    return sendMessage({
      channel: "WHATSAPP",

      to,

      body,

      metadata,
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
  }) => {
    return sendMessage({
      channel: "VOICE",

      to,

      body,

      metadata,
    });
  };

export default {
  sendMessage,
  sendEmail,
  sendSMS,
  sendWhatsApp,
  sendVoice,
};