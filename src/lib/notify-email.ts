type Email = {
  subject: string;
  text: string;
  replyTo?: string;
};

// Sends a notification to the coach via Resend's HTTP API.
// Does nothing (just logs) when RESEND_API_KEY or COACHING_NOTIFY_EMAIL is not set.
export async function sendCoachNotification({ subject, text, replyTo }: Email) {
  const apiKey = process.env.RESEND_API_KEY;
  const to = process.env.COACHING_NOTIFY_EMAIL;
  if (!apiKey || !to) {
    console.warn("Email de notificação não enviado: falta RESEND_API_KEY ou COACHING_NOTIFY_EMAIL.");
    return;
  }

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: process.env.COACHING_FROM_EMAIL || "PN Coaching <onboarding@resend.dev>",
      to: [to],
      subject,
      text,
      reply_to: replyTo,
    }),
  });

  if (!res.ok) {
    console.error("Falha ao enviar email de notificação:", res.status, await res.text());
  }
}
