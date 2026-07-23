import {
  sendOutboundMessage,
  getMessageList,
  getMessageDetail,
  cancelScheduledMessage,
} from "../services/messagingService.js";

export const getMessages = async (req, res, next) => {
  try {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 20;

    const result = await getMessageList({ page, limit });

    res.json(result);
  } catch (error) {
    next(error);
  }
};

export const getMessageById = async (req, res, next) => {
  try {
    const result = await getMessageDetail(req.params.id);

    if (!result?.success) {
      return res.status(502).json({
        message: "Unable to fetch message details.",
        error: result?.error,
      });
    }

    return res.json(result);
  } catch (error) {
    return next(error);
  }
};

export const sendMessageRequest = async (req, res, next) => {
  try {
    const {
      channel = "EMAIL",
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
    } = req.body;

    const hasBody = typeof body === "string" ? body.trim().length > 0 : false;
    const hasPayload = payload !== undefined && payload !== null;

    if (!to || (!hasBody && !hasPayload)) {
      return res.status(400).json({
        message: "Please provide a recipient and either a message body or payload.",
      });
    }

    const result = await sendOutboundMessage({
      channel,
      to,
      subject,
      body,
      payload,
      metadata,
      from,
      scheduledAt,
      externalId,
      idempotencyKey: idempotencyKey || req.headers["idempotency-key"] || req.headers["Idempotency-Key"],
      dlt_template_id,
      dlt_entity_id,
      sender_id,
      last_user_message_at,
      is_template,
    });

    if (!result?.success) {
      return res.status(502).json({
        message: "Messenger delivery failed.",
        error: result?.error,
      });
    }

    return res.status(202).json(result);
  } catch (error) {
    return next(error);
  }
};

export const cancelMessageRequest = async (req, res, next) => {
  try {
    const result = await cancelScheduledMessage(req.params.id);

    if (!result?.success) {
      return res.status(502).json({
        message: "Unable to cancel the scheduled message.",
        error: result?.error,
      });
    }

    return res.status(204).end();
  } catch (error) {
    return next(error);
  }
};
