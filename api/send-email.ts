/**
 * Vercel API Route – proxy para Resend API (evita CORS do browser)
 * POST /api/send-email
 */

const RESEND_API_KEY = process.env.RESEND_API_KEY ?? '';
const TO_EMAIL = 'joao.silvestrim@gmail.com';

export default async function handler(
  req: { method: string; body: { subject: string; html: string; text?: string } },
  res: {
    setHeader: (k: string, v: string) => void;
    status: (code: number) => { end: () => void; json: (d: unknown) => void };
  }
) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { subject, html, text } = req.body;

  if (!subject || !html) return res.status(400).json({ error: 'subject and html are required' });
  if (!RESEND_API_KEY) return res.status(500).json({ error: 'RESEND_API_KEY not configured' });

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'TaskNexus <onboarding@resend.dev>',
        to: [TO_EMAIL],
        subject,
        html,
        text: text ?? '',
      }),
    });

    const data = await response.json();
    if (!response.ok) return res.status(response.status).json({ error: data });
    return res.status(200).json({ success: true, id: (data as { id: string }).id });
  } catch (err) {
    return res.status(500).json({ error: String(err) });
  }
}
