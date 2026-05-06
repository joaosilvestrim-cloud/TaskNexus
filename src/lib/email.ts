/**
 * TaskNexus – Email via Resend API
 * Sempre envia para joao.silvestrim@gmail.com
 */

const RESEND_API_KEY = import.meta.env.VITE_RESEND_API_KEY as string;
const TO_EMAIL = 'joao.silvestrim@gmail.com';
const FROM_EMAIL = 'TaskNexus <onboarding@resend.dev>';

interface SendEmailOptions {
  subject: string;
  html: string;
  text?: string;
}

export async function sendEmail(opts: SendEmailOptions): Promise<boolean> {
  if (!RESEND_API_KEY) {
    console.warn('[email] VITE_RESEND_API_KEY não configurado');
    return false;
  }

  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: FROM_EMAIL,
        to: [TO_EMAIL],
        subject: opts.subject,
        html: opts.html,
        text: opts.text ?? '',
      }),
    });

    if (!res.ok) {
      const err = await res.json();
      console.error('[email] Resend error:', err);
      return false;
    }

    const data = await res.json();
    console.log('[email] ✓ Enviado:', data.id);
    return true;
  } catch (err) {
    console.error('[email] Erro inesperado:', err);
    return false;
  }
}

// ── Templates ─────────────────────────────────────────────────────────────────

export function emailTaskReminder(taskTitle: string, dueDate: string, dueTime?: string | null) {
  const when = dueTime ? `${dueDate} às ${dueTime}` : dueDate;
  return sendEmail({
    subject: `⏰ Lembrete: ${taskTitle}`,
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:24px">
        <h2 style="color:#6366f1;margin:0 0 8px">TaskNexus</h2>
        <hr style="border:none;border-top:1px solid #e5e7eb;margin:16px 0"/>
        <p style="font-size:16px;color:#111827;margin:0 0 8px">
          Você tem uma tarefa com lembrete:
        </p>
        <div style="background:#f3f4f6;border-radius:8px;padding:16px;margin:16px 0">
          <p style="font-size:18px;font-weight:600;color:#111827;margin:0 0 4px">${taskTitle}</p>
          <p style="font-size:14px;color:#6b7280;margin:0">📅 ${when}</p>
        </div>
        <a href="https://task-nexus-seven.vercel.app"
           style="display:inline-block;background:#6366f1;color:#fff;padding:10px 20px;border-radius:6px;text-decoration:none;font-size:14px">
          Abrir TaskNexus →
        </a>
        <p style="font-size:12px;color:#9ca3af;margin-top:24px">TaskNexus · Enviado automaticamente</p>
      </div>
    `,
    text: `Lembrete TaskNexus: ${taskTitle} — ${when}`,
  });
}

export function emailTaskDue(taskTitle: string, dueDate: string) {
  return sendEmail({
    subject: `🔴 Tarefa vencida: ${taskTitle}`,
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:24px">
        <h2 style="color:#ef4444;margin:0 0 8px">TaskNexus</h2>
        <hr style="border:none;border-top:1px solid #e5e7eb;margin:16px 0"/>
        <p style="font-size:16px;color:#111827;margin:0 0 8px">
          Uma tarefa passou do prazo:
        </p>
        <div style="background:#fef2f2;border:1px solid #fecaca;border-radius:8px;padding:16px;margin:16px 0">
          <p style="font-size:18px;font-weight:600;color:#111827;margin:0 0 4px">${taskTitle}</p>
          <p style="font-size:14px;color:#ef4444;margin:0">⚠️ Venceu em ${dueDate}</p>
        </div>
        <a href="https://task-nexus-seven.vercel.app"
           style="display:inline-block;background:#ef4444;color:#fff;padding:10px 20px;border-radius:6px;text-decoration:none;font-size:14px">
          Ver tarefa →
        </a>
        <p style="font-size:12px;color:#9ca3af;margin-top:24px">TaskNexus · Enviado automaticamente</p>
      </div>
    `,
    text: `Tarefa vencida no TaskNexus: ${taskTitle} — venceu em ${dueDate}`,
  });
}

export function emailDailySummary(tasks: { title: string; dueDate: string; priority: string }[]) {
  const rows = tasks.map(t => `
    <tr>
      <td style="padding:8px 12px;border-bottom:1px solid #e5e7eb">${t.title}</td>
      <td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;color:#6b7280">${t.dueDate}</td>
      <td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;color:#6366f1">${t.priority.toUpperCase()}</td>
    </tr>
  `).join('');

  return sendEmail({
    subject: `📋 Resumo diário — ${new Date().toLocaleDateString('pt-BR')}`,
    html: `
      <div style="font-family:sans-serif;max-width:560px;margin:0 auto;padding:24px">
        <h2 style="color:#6366f1;margin:0 0 4px">TaskNexus</h2>
        <p style="color:#6b7280;font-size:14px;margin:0 0 20px">Resumo do dia — ${new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}</p>
        <hr style="border:none;border-top:1px solid #e5e7eb;margin:0 0 20px"/>
        <p style="font-size:15px;color:#111827;margin:0 0 12px">Você tem <strong>${tasks.length}</strong> tarefa(s) para hoje:</p>
        <table style="width:100%;border-collapse:collapse;font-size:14px">
          <thead>
            <tr style="background:#f9fafb">
              <th style="padding:8px 12px;text-align:left;color:#374151">Tarefa</th>
              <th style="padding:8px 12px;text-align:left;color:#374151">Data</th>
              <th style="padding:8px 12px;text-align:left;color:#374151">Prioridade</th>
            </tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>
        <br/>
        <a href="https://task-nexus-seven.vercel.app"
           style="display:inline-block;background:#6366f1;color:#fff;padding:10px 20px;border-radius:6px;text-decoration:none;font-size:14px">
          Abrir TaskNexus →
        </a>
        <p style="font-size:12px;color:#9ca3af;margin-top:24px">TaskNexus · Resumo automático diário</p>
      </div>
    `,
    text: `Resumo TaskNexus: ${tasks.length} tarefa(s) para hoje.\n${tasks.map(t => `- ${t.title} (${t.dueDate})`).join('\n')}`,
  });
}
