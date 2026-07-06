export const sendEmailViaUMS = async ({
  to,
  subject,
  body,
  metadata = {},
}) => {
  const UMS_URL = (
    process.env.UMS_URL || "http://127.0.0.1:3000"
  ).replace(/\/$/, "");

  const UMS_API_KEY =
    process.env.UMS_API_KEY || "test-api-key-12345";

  console.log("=================================");
  console.log("UMS_URL:", UMS_URL);
  console.log("UMS_API_KEY:", UMS_API_KEY);
  console.log("=================================");

  if (!to || !subject || !body) {
    throw new Error(
      "UMS email requires to, subject, and body"
    );
  }

  const controller = new AbortController();
  const timeout = setTimeout(
    () => controller.abort(),
    15000
  );

  try {
    const endpoint = `${UMS_URL}/v1/messages`;

    console.log("Sending UMS request to:", endpoint);

    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-API-Key": UMS_API_KEY,
      },
      body: JSON.stringify({
        channel: "EMAIL",
        to,
        subject,
        body,
        metadata,
      }),
      signal: controller.signal,
    });

    let data = null;

    try {
      data = await response.json();
    } catch {
      data = null;
    }

    console.log("UMS Response Status:", response.status);
    console.log("UMS Response Data:", data);

    if (!response.ok) {
      const message =
        data?.error?.message ||
        data?.message ||
        `UMS request failed (${response.status})`;

      throw new Error(message);
    }

    return data;
  } catch (error) {
    console.error("UMS Error:", error);
    throw error;
  } finally {
    clearTimeout(timeout);
  }
};

export default {
  sendEmailViaUMS,
};