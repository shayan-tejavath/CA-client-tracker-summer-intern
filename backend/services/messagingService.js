import {
  sendEmail,
  sendSMS,
  sendWhatsApp,
  sendVoice,
  listMessages,
  getMessageById,
  cancelMessage,
} from "./messengerClient.js";

const resolveChannel = (channel) => {
  const normalized = String(channel || "EMAIL").toUpperCase();
  if (normalized === "SMS") return "SMS";
  if (normalized === "WHATSAPP") return "WHATSAPP";
  if (normalized === "VOICE") return "VOICE";
  return "EMAIL";
};

export const sendOutboundMessage = async ({
  channel,
  to,
  subject = "",
  body,
  payload,
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
  const normalizedChannel = resolveChannel(channel);

  const sharedOptions = {
    to,
    body,
    payload,
    metadata,
    from,
    scheduledAt,
    externalId,
    idempotencyKey,
    dlt_template_id,
    dlt_entity_id,
    sender_id,
    last_user_message_at,
    is_template,
  };

  if (normalizedChannel === "SMS") {
    return sendSMS(sharedOptions);
  }

  if (normalizedChannel === "WHATSAPP") {
    return sendWhatsApp(sharedOptions);
  }

  if (normalizedChannel === "VOICE") {
    return sendVoice(sharedOptions);
  }

  return sendEmail({ ...sharedOptions, subject });
};

export const getMessageList = async ({ page = 1, limit = 20 } = {}) => {
  const response = await listMessages({ page, limit });

  if (!response.success) {
    return {
      success: false,
      error: response.error,
      page,
      limit,
    };
  }

  return {
    success: true,
    data: Array.isArray(response.data) ? response.data : [],
    page: response.page ?? page,
    limit: response.limit ?? limit,
  };
};

export const getMessageDetail = async (id) => {
  const response = await getMessageById(id);

  if (!response.success) {
    return {
      success: false,
      error: response.error,
    };
  }

  return {
    success: true,
    data: response.data,
  };
};

export const cancelScheduledMessage = async (id) => {
  const response = await cancelMessage(id);

  if (!response.success) {
    return {
      success: false,
      error: response.error,
    };
  }

  return {
    success: true,
    data: response.data,
  };
};
