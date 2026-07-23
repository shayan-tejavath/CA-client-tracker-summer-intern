import { useEffect, useMemo, useState } from "react";
import { toast } from "react-toastify";
import DashboardLayout from "../../layouts/DashboardLayout.jsx";
import {
  cancelMessage,
  getMessageById,
  getMessages,
  sendMessage,
} from "../../services/notificationService.js";
import "./messaging.css";

const initialForm = {
  channel: "EMAIL",
  from: "",
  to: "",
  subject: "",
  body: "",
  scheduledAt: "",
  externalId: "",
  idempotencyKey: "",
  dlt_template_id: "",
  dlt_entity_id: "",
  sender_id: "",
  last_user_message_at: "",
  is_template: false,
  payload: "",
  metadata: "",
};

const MessagingPage = () => {
  const [form, setForm] = useState(initialForm);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [selectedMessage, setSelectedMessage] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const formatDateTimeLocal = (value) => {
    if (!value) return "";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "";
    return date.toISOString().slice(0, 16);
  };

  const parseJsonField = (value) => {
    if (!value || !value.trim()) return undefined;

    try {
      return JSON.parse(value);
    } catch {
      throw new Error("Advanced fields must be valid JSON.");
    }
  };

  const loadMessages = async () => {
    try {
      setLoading(true);
      const messages = await getMessages({ page: 1, limit: 10 });
      setMessages(Array.isArray(messages) ? messages : []);
    } catch (error) {
      toast.error(error.response?.data?.message || "Unable to load messages.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMessages();
  }, []);

  const refreshSelectedMessage = async (messageId) => {
    if (!messageId) return;

    try {
      setDetailLoading(true);
      const message = await getMessageById(messageId);
      setSelectedMessage(message ?? null);
    } catch (error) {
      toast.error(error.response?.data?.message || "Unable to load message details.");
    } finally {
      setDetailLoading(false);
    }
  };

  const handleChange = (event) => {
    const { name, type, value, checked } = event.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleAdvancedToggle = () => {
    setShowAdvanced((prev) => !prev);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    const hasBody = typeof form.body === "string" ? form.body.trim().length > 0 : false;
    const hasPayload = typeof form.payload === "string" ? form.payload.trim().length > 0 : false;

    if (!form.to || (!hasBody && !hasPayload)) {
      toast.error("Please provide a recipient and either a message body or payload.");
      return;
    }

    try {
      setSubmitting(true);
      const messagePayload = {
        channel: form.channel,
        to: form.to,
        subject: form.subject || undefined,
        body: form.body || undefined,
        from: form.from || undefined,
        scheduledAt: form.scheduledAt ? new Date(form.scheduledAt).toISOString() : undefined,
        externalId: form.externalId || undefined,
        idempotencyKey: form.idempotencyKey || undefined,
        dlt_template_id: form.dlt_template_id || undefined,
        dlt_entity_id: form.dlt_entity_id || undefined,
        sender_id: form.sender_id || undefined,
        last_user_message_at: form.last_user_message_at
          ? new Date(form.last_user_message_at).toISOString()
          : undefined,
        is_template: form.is_template || undefined,
      };

      const metadata = parseJsonField(form.metadata);
      const payload = parseJsonField(form.payload);

      if (metadata !== undefined) {
        messagePayload.metadata = {
          ...metadata,
          source: "ca-client-tracker",
        };
      } else {
        messagePayload.metadata = { source: "ca-client-tracker" };
      }

      if (payload !== undefined) {
        messagePayload.payload = payload;
      }

      await sendMessage(messagePayload);
      toast.success("Message queued successfully.");
      setForm(initialForm);
      await loadMessages();
    } catch (error) {
      toast.error(error.message || error.response?.data?.message || "Message delivery failed.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancel = async (messageId) => {
    try {
      await cancelMessage(messageId);
      toast.success("Scheduled message cancelled.");
      await loadMessages();
      if (selectedMessage?.id === messageId) {
        setSelectedMessage(null);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Unable to cancel the message.");
    }
  };

  const handleSelectMessage = async (messageId) => {
    await refreshSelectedMessage(messageId);
  };

  const summary = useMemo(() => {
    return {
      total: messages.length,
      queued: messages.filter((message) => String(message.status || "").toLowerCase() === "queued").length,
      delivered: messages.filter((message) => String(message.status || "").toLowerCase() === "delivered").length,
    };
  }, [messages]);

  return (
    <DashboardLayout>
      <div className="messaging-page">
        <section className="messaging-hero">
          <div>
            <p className="messaging-eyebrow">Communications</p>
            <h1 className="messaging-title">Messaging Center</h1>
            <p className="messaging-subtitle">
              Send outbound messages through the existing Messenger transport layer and review recent activity.
            </p>
          </div>
          <div className="messaging-summary-card">
            <div>
              <strong>{summary.total}</strong>
              <span>Messages</span>
            </div>
            <div>
              <strong>{summary.queued}</strong>
              <span>Queued</span>
            </div>
            <div>
              <strong>{summary.delivered}</strong>
              <span>Delivered</span>
            </div>
          </div>
        </section>

        <section className="messaging-grid">
          <form className="messaging-panel" onSubmit={handleSubmit}>
            <h2>Compose message</h2>
            <label className="messaging-field">
              <span>Channel</span>
              <select name="channel" value={form.channel} onChange={handleChange}>
                <option value="EMAIL">Email</option>
                <option value="SMS">SMS</option>
                <option value="WHATSAPP">WhatsApp</option>
                <option value="VOICE">Voice</option>
              </select>
            </label>
            <label className="messaging-field">
              <span>From</span>
              <input name="from" value={form.from} onChange={handleChange} placeholder="Sender address" />
            </label>
            <label className="messaging-field">
              <span>Recipient</span>
              <input name="to" value={form.to} onChange={handleChange} placeholder="name@example.com or +91..." />
            </label>
            <label className="messaging-field">
              <span>Subject</span>
              <input name="subject" value={form.subject} onChange={handleChange} placeholder="Optional subject" />
            </label>
            <label className="messaging-field">
              <span>Message</span>
              <textarea name="body" value={form.body} onChange={handleChange} rows={6} placeholder="Write your message here" />
            </label>
            <button type="button" className="messaging-advanced-toggle" onClick={handleAdvancedToggle}>
              {showAdvanced ? "Hide advanced options" : "Show advanced options"}
            </button>
            {showAdvanced && (
              <div className="messaging-advanced">
                <label className="messaging-field">
                  <span>Scheduled at</span>
                  <input
                    type="datetime-local"
                    name="scheduledAt"
                    value={formatDateTimeLocal(form.scheduledAt)}
                    onChange={handleChange}
                  />
                </label>
                <label className="messaging-field">
                  <span>External ID</span>
                  <input name="externalId" value={form.externalId} onChange={handleChange} placeholder="Optional external ID" />
                </label>
                <label className="messaging-field">
                  <span>Idempotency key</span>
                  <input name="idempotencyKey" value={form.idempotencyKey} onChange={handleChange} placeholder="Optional idempotency key" />
                </label>
                <label className="messaging-field">
                  <span>DLT template ID</span>
                  <input name="dlt_template_id" value={form.dlt_template_id} onChange={handleChange} placeholder="Optional DLT template ID" />
                </label>
                <label className="messaging-field">
                  <span>DLT entity ID</span>
                  <input name="dlt_entity_id" value={form.dlt_entity_id} onChange={handleChange} placeholder="Optional DLT entity ID" />
                </label>
                <label className="messaging-field">
                  <span>Sender ID</span>
                  <input name="sender_id" value={form.sender_id} onChange={handleChange} placeholder="Optional sender ID" />
                </label>
                <label className="messaging-field">
                  <span>Last user message at</span>
                  <input
                    type="datetime-local"
                    name="last_user_message_at"
                    value={formatDateTimeLocal(form.last_user_message_at)}
                    onChange={handleChange}
                  />
                </label>
                <label className="messaging-field messaging-checkbox-field">
                  <span>Template</span>
                  <input type="checkbox" name="is_template" checked={form.is_template} onChange={handleChange} />
                </label>
                <label className="messaging-field">
                  <span>Payload (JSON)</span>
                  <textarea
                    name="payload"
                    value={form.payload}
                    onChange={handleChange}
                    rows={4}
                    placeholder='{"key":"value"}'
                  />
                </label>
                <label className="messaging-field">
                  <span>Metadata (JSON)</span>
                  <textarea
                    name="metadata"
                    value={form.metadata}
                    onChange={handleChange}
                    rows={4}
                    placeholder='{"source":"ca-client-tracker"}'
                  />
                </label>
              </div>
            )}
            <button type="submit" className="messaging-submit" disabled={submitting}>
              {submitting ? "Sending..." : "Send message"}
            </button>
          </form>

          <div className="messaging-panel">
            <div className="messaging-panel-header">
              <h2>Recent activity</h2>
              <span>{loading ? "Loading…" : `${messages.length} items`}</span>
            </div>
            {loading ? (
              <p className="messaging-empty">Loading recent messages…</p>
            ) : messages.length === 0 ? (
              <p className="messaging-empty">No messages yet.</p>
            ) : (
              <ul className="messaging-list">
                {messages.map((message) => (
                  <li
                    key={message.id || message._id || message.to}
                    className="messaging-item"
                    onClick={() => handleSelectMessage(message.id)}
                  >
                    <div>
                      <p className="messaging-item-title">{message.subject || message.body || "Message"}</p>
                      <p className="messaging-item-meta">
                        {message.to || "Recipient unavailable"} • {message.channel}
                      </p>
                      <p className="messaging-item-meta">
                        {message.createdAt ? new Date(message.createdAt).toLocaleString() : ""}
                        {message.scheduledAt ? ` • scheduled ${new Date(message.scheduledAt).toLocaleString()}` : ""}
                      </p>
                      {message.externalId && (
                        <p className="messaging-item-meta">External ID: {message.externalId}</p>
                      )}
                    </div>
                    <div className="messaging-item-actions">
                      <span className="messaging-pill">{message.status || "queued"}</span>
                      {String(message.status || "").toLowerCase() === "scheduled" && (
                        <button
                          type="button"
                          className="messaging-action-button messaging-action-button--cancel"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleCancel(message.id);
                          }}
                        >
                          Cancel
                        </button>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            )}
            {selectedMessage && (
              <div className="messaging-detail-panel">
                <div className="messaging-panel-header">
                  <h2>Message details</h2>
                  {detailLoading ? <span>Loading…</span> : null}
                </div>
                <div className="messaging-detail-grid">
                  <div>
                    <p className="messaging-detail-label">ID</p>
                    <p>{selectedMessage.id}</p>
                  </div>
                  <div>
                    <p className="messaging-detail-label">Channel</p>
                    <p>{selectedMessage.channel}</p>
                  </div>
                  <div>
                    <p className="messaging-detail-label">Status</p>
                    <p>{selectedMessage.status}</p>
                  </div>
                  <div>
                    <p className="messaging-detail-label">To</p>
                    <p>{selectedMessage.to}</p>
                  </div>
                  {selectedMessage.externalId && (
                    <div>
                      <p className="messaging-detail-label">External ID</p>
                      <p>{selectedMessage.externalId}</p>
                    </div>
                  )}
                  {selectedMessage.scheduledAt && (
                    <div>
                      <p className="messaging-detail-label">Scheduled at</p>
                      <p>{new Date(selectedMessage.scheduledAt).toLocaleString()}</p>
                    </div>
                  )}
                  <div>
                    <p className="messaging-detail-label">Created at</p>
                    <p>{new Date(selectedMessage.createdAt).toLocaleString()}</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </section>
      </div>
    </DashboardLayout>
  );
};

export default MessagingPage;
