/**
 * Parser de itens de ação em texto livre de atas de reunião.
 * Suporta sintaxe:
 *   [ ] Título da tarefa @prazo:15/05 #p1
 *   [ ] Título da tarefa @prazo:amanhã #p2
 *   - [ ] Título sem data
 */
import { v4 as uuid } from 'uuid';
import type { MeetingActionItem, Priority } from '../types';

const TODAY = new Date();

function parseDate(raw: string): string | null {
  const s = raw.toLowerCase().trim();
  if (s === 'hoje') return TODAY.toISOString().split('T')[0];
  if (s === 'amanhã' || s === 'amanha') {
    const d = new Date(TODAY); d.setDate(d.getDate() + 1);
    return d.toISOString().split('T')[0];
  }
  if (s === 'semana' || s === 'proxima semana' || s === 'próxima semana') {
    const d = new Date(TODAY); d.setDate(d.getDate() + 7);
    return d.toISOString().split('T')[0];
  }
  // dd/mm or dd/mm/yy or dd/mm/yyyy
  const m = s.match(/^(\d{1,2})\/(\d{1,2})(?:\/(\d{2,4}))?$/);
  if (m) {
    const day = parseInt(m[1]);
    const month = parseInt(m[2]) - 1;
    const year = m[3]
      ? (m[3].length === 2 ? 2000 + parseInt(m[3]) : parseInt(m[3]))
      : TODAY.getFullYear();
    const d = new Date(year, month, day);
    if (!isNaN(d.getTime())) return d.toISOString().split('T')[0];
  }
  return null;
}

function parsePriority(raw: string): Priority {
  const s = raw.toLowerCase();
  if (s === 'p1' || s === '#p1') return 'p1';
  if (s === 'p2' || s === '#p2') return 'p2';
  if (s === 'p3' || s === '#p3') return 'p3';
  return 'p4';
}

export function parseActionItems(text: string): MeetingActionItem[] {
  const lines = text.split('\n');
  const items: MeetingActionItem[] = [];

  for (const raw of lines) {
    const line = raw.trim();
    // Match: [ ] texto, - [ ] texto, * [ ] texto
    if (!/^(-|\*|•)?\s*\[\s*\]\s/.test(line)) continue;

    let rest = line.replace(/^(-|\*|•)?\s*\[\s*\]\s*/, '').trim();

    // Extract @prazo:xxx
    let dueDate: string | null = null;
    rest = rest.replace(/@prazo:(\S+)/i, (_, val) => {
      dueDate = parseDate(val);
      return '';
    });

    // Extract #p1 / #p2 / #p3 / #p4
    let priority: Priority = 'p4';
    rest = rest.replace(/#(p[1-4])\b/i, (_, val) => {
      priority = parsePriority(val);
      return '';
    });

    const title = rest.trim().replace(/\s+/g, ' ');
    if (!title) continue;

    items.push({
      id: uuid(),
      text: title,
      priority,
      dueDate,
      converted: false,
      taskId: null,
    });
  }

  return items;
}

export const MEETING_TEMPLATES: Record<string, { agenda: string; discussion: string; decisions: string; actionItems: string }> = {
  blank: {
    agenda: '',
    discussion: '',
    decisions: '',
    actionItems: '',
  },
  client: {
    agenda: `1. Apresentação e alinhamento
2. Status do projeto
3. Dúvidas e pendências
4. Próximos passos`,
    discussion: ``,
    decisions: ``,
    actionItems: `[ ] Enviar proposta revisada @prazo:amanhã #p1
[ ] Agendar próxima reunião @prazo:semana #p2
[ ] Compartilhar documentação `,
  },
  daily: {
    agenda: `Daily Standup`,
    discussion: `O que foi feito ontem:

O que será feito hoje:

Impedimentos:`,
    decisions: ``,
    actionItems: ``,
  },
  sprint: {
    agenda: `1. Review das histórias concluídas
2. Demo das funcionalidades
3. Planejamento do próximo sprint
4. Definição de metas`,
    discussion: ``,
    decisions: ``,
    actionItems: `[ ] Atualizar backlog @prazo:hoje #p1
[ ] Criar histórias do próximo sprint @prazo:amanhã #p2
[ ] Atualizar documentação técnica @prazo:semana #p3`,
  },
  retrospective: {
    agenda: `1. O que foi bem
2. O que pode melhorar
3. Ações de melhoria`,
    discussion: `**O que foi bem:**


**O que pode melhorar:**


**Ideias:**`,
    decisions: ``,
    actionItems: `[ ] Implementar melhoria de processo @prazo:semana #p2
[ ] Compartilhar resultado da retro com o time @prazo:hoje #p3`,
  },
};
