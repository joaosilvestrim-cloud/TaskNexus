/**
 * TaskNexus – Gemini AI helper para Atas de Reunião
 */

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY as string;
const API_URL = `https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key=${API_KEY}`;

async function ask(prompt: string): Promise<string> {
  const res = await fetch(API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { temperature: 0.7, maxOutputTokens: 2048 },
    }),
  });

  if (!res.ok) {
    const err = await res.json();
    throw new Error(err?.error?.message ?? 'Gemini API error');
  }

  const data = await res.json();
  return data.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
}

// ── Recursos de IA ────────────────────────────────────────────────────────────

/** Melhora a escrita da ata toda mantendo o conteúdo original */
export async function improveNote(meeting: {
  title: string;
  agenda: string;
  discussion: string;
  decisions: string;
}): Promise<{ agenda: string; discussion: string; decisions: string }> {
  const prompt = `Você é um assistente especialista em redação de atas de reunião corporativas em português brasileiro.
Melhore o texto das seções abaixo, tornando-o mais claro, profissional e bem estruturado.
Mantenha todas as informações originais. Não invente novos dados.
Retorne APENAS um JSON válido com as chaves: agenda, discussion, decisions.

Reunião: ${meeting.title}

PAUTA ORIGINAL:
${meeting.agenda || '(vazia)'}

DISCUSSÃO ORIGINAL:
${meeting.discussion || '(vazia)'}

DECISÕES ORIGINAIS:
${meeting.decisions || '(vazia)'}

Retorne apenas o JSON, sem markdown, sem explicações.`;

  const raw = await ask(prompt);
  const cleaned = raw.replace(/```json|```/g, '').trim();
  return JSON.parse(cleaned);
}

/** Extrai automaticamente os itens de ação do texto da ata */
export async function extractActionItems(meeting: {
  title: string;
  discussion: string;
  decisions: string;
}): Promise<Array<{ text: string; priority: 'p1' | 'p2' | 'p3' | 'p4'; dueDate: string | null }>> {
  const today = new Date().toISOString().split('T')[0];
  const prompt = `Analise o texto desta ata de reunião e extraia TODOS os itens de ação mencionados (tarefas, responsabilidades, follow-ups).

Reunião: ${meeting.title}
Data de hoje: ${today}

DISCUSSÃO:
${meeting.discussion || '(vazia)'}

DECISÕES:
${meeting.decisions || '(vazia)'}

Para cada item de ação extraído, determine:
- text: título claro e objetivo da tarefa (máx 80 chars)
- priority: p1 (urgente/crítico), p2 (importante), p3 (normal), p4 (baixa)
- dueDate: data no formato YYYY-MM-DD se mencionada, ou null

Retorne APENAS um array JSON. Exemplo:
[{"text":"Enviar proposta comercial","priority":"p1","dueDate":"2024-01-15"},{"text":"Agendar reunião de follow-up","priority":"p2","dueDate":null}]

Sem markdown, sem explicações, apenas o JSON.`;

  const raw = await ask(prompt);
  const cleaned = raw.replace(/```json|```/g, '').trim();
  return JSON.parse(cleaned);
}

/** Gera um resumo executivo da ata */
export async function summarizeNote(meeting: {
  title: string;
  date: string;
  participants: string[];
  agenda: string;
  discussion: string;
  decisions: string;
}): Promise<string> {
  const prompt = `Gere um resumo executivo conciso desta ata de reunião em português brasileiro.
O resumo deve ter no máximo 5 linhas e destacar: o objetivo da reunião, principais decisões e próximos passos.

Reunião: ${meeting.title}
Data: ${meeting.date}
Participantes: ${meeting.participants.join(', ') || 'não informado'}

PAUTA: ${meeting.agenda || '(vazia)'}
DISCUSSÃO: ${meeting.discussion || '(vazia)'}
DECISÕES: ${meeting.decisions || '(vazia)'}

Retorne apenas o texto do resumo, sem markdown, sem títulos.`;

  return await ask(prompt);
}

/** Sugere próximos passos com base na ata */
export async function suggestNextSteps(meeting: {
  title: string;
  discussion: string;
  decisions: string;
}): Promise<string[]> {
  const prompt = `Com base nesta ata de reunião, sugira de 3 a 6 próximos passos estratégicos que podem não ter sido mencionados explicitamente, mas são importantes para o sucesso do projeto/reunião.

Reunião: ${meeting.title}
DISCUSSÃO: ${meeting.discussion || '(vazia)'}
DECISÕES: ${meeting.decisions || '(vazia)'}

Retorne APENAS um array JSON de strings. Exemplo:
["Definir responsáveis para cada ação","Criar cronograma de acompanhamento"]

Sem markdown, sem explicações.`;

  const raw = await ask(prompt);
  const cleaned = raw.replace(/```json|```/g, '').trim();
  return JSON.parse(cleaned);
}
