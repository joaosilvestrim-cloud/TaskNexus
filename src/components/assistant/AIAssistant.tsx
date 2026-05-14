import { useState, useRef, useEffect } from 'react';
import { X, Send, Sparkles, Loader2, CheckCircle2, ChevronDown } from 'lucide-react';
import { Tooltip } from '../shared/Tooltip';
import { useStore } from '../../store/useStore';
import type { Priority } from '../../types';

interface ParsedTask {
  title: string;
  description?: string;
  priority: Priority;
  dueDate: string | null;
  projectName: string | null;
  status: string;
}

interface Message {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  tasks?: ParsedTask[];
  creating?: boolean;
  created?: boolean;
}

const SUGGESTIONS = [
  'Crie 3 tarefas para o lançamento do app: reunião com cliente, apresentação e revisão de contrato',
  'Adiciona uma tarefa urgente de revisar o relatório para hoje',
  'Cria tarefas semanais de acompanhamento do projeto com prioridade alta',
  'Preciso organizar o onboarding do novo funcionário em etapas',
];

const SYSTEM_PROMPT = `Você é um assistente de produtividade do TaskNexus. Sua função é interpretar pedidos em linguagem natural e criar tarefas estruturadas para o quadro Kanban.

Ao receber um pedido, responda SEMPRE com:
1. Uma mensagem curta e amigável explicando o que vai criar (máx 2 linhas)
2. Um bloco JSON com as tarefas

Formato do JSON (retorne APENAS isso, sem markdown):
TASKS_JSON:
[
  {
    "title": "título da tarefa",
    "description": "descrição opcional",
    "priority": "p1|p2|p3|p4",
    "dueDate": "YYYY-MM-DD ou null",
    "projectName": "nome do projeto ou null",
    "status": "todo"
  }
]

Regras de prioridade:
- p1 = urgente / crítico / hoje / imediato
- p2 = alta / importante / esta semana
- p3 = média / normal (padrão)
- p4 = baixa / quando der / futura

Data de hoje: ${new Date().toISOString().split('T')[0]}

Se o usuário mencionar "hoje", use a data atual. "amanhã" = +1 dia. "próxima semana" = +7 dias.
Seja criativo e detalhe bem as tarefas quando o pedido for genérico.
Sempre responda em português.`;

export function AIAssistant() {
  const { addTask, projects } = useStore();
  const [open, setOpen]             = useState(false);
  const [messages, setMessages]     = useState<Message[]>([
    {
      id: '0', role: 'assistant',
      text: 'Olá! 👋 Sou o **Nex**, seu assistente de produtividade. Me diga o que você precisa fazer e eu crio os cards no Kanban automaticamente!\n\nPode me contar em linguagem natural — eu entendo tudo. 🚀',
    }
  ]);
  const [input, setInput]           = useState('');
  const [loading, setLoading]       = useState(false);
  const [pulse, setPulse]           = useState(true);
  const messagesEndRef              = useRef<HTMLDivElement>(null);
  const inputRef                    = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    const t = setTimeout(() => setPulse(false), 4000);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 100);
  }, [open]);

  const callGemini = async (userMessage: string): Promise<{ reply: string; tasks: ParsedTask[] }> => {
    const API_KEY = import.meta.env.VITE_GEMINI_API_KEY as string;
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [
            { role: 'user', parts: [{ text: SYSTEM_PROMPT }] },
            { role: 'model', parts: [{ text: 'Entendido! Estou pronto para criar tarefas no Kanban.' }] },
            { role: 'user', parts: [{ text: userMessage }] },
          ],
        }),
      }
    );
    const data = await res.json();
    const raw  = data.candidates?.[0]?.content?.parts?.[0]?.text ?? '';

    const jsonMatch = raw.match(/TASKS_JSON:\s*(\[[\s\S]*?\])/);
    const reply     = raw.replace(/TASKS_JSON:[\s\S]*/, '').trim();
    const tasks: ParsedTask[] = jsonMatch ? JSON.parse(jsonMatch[1]) : [];

    return { reply, tasks };
  };

  const handleSend = async (text = input.trim()) => {
    if (!text || loading) return;
    setInput('');

    const userMsg: Message = { id: crypto.randomUUID(), role: 'user', text };
    const thinkingMsg: Message = { id: crypto.randomUUID(), role: 'assistant', text: '', creating: true };

    setMessages(prev => [...prev, userMsg, thinkingMsg]);
    setLoading(true);

    try {
      const { reply, tasks } = await callGemini(text);
      setMessages(prev => prev.map(m =>
        m.id === thinkingMsg.id
          ? { ...m, text: reply, tasks, creating: false }
          : m
      ));
    } catch {
      setMessages(prev => prev.map(m =>
        m.id === thinkingMsg.id
          ? { ...m, text: '⚠️ Erro ao conectar com o Gemini. Verifique sua API key.', creating: false }
          : m
      ));
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTasks = async (msgId: string, tasks: ParsedTask[]) => {
    setMessages(prev => prev.map(m => m.id === msgId ? { ...m, creating: true } : m));

    for (const t of tasks) {
      const proj = projects.find(p => p.name.toLowerCase() === t.projectName?.toLowerCase());
      await addTask({
        title:       t.title,
        description: t.description ?? '',
        priority:    t.priority,
        dueDate:     t.dueDate,
        status:      t.status ?? 'todo',
        projectId:   proj?.id ?? null,
      });
    }

    setMessages(prev => prev.map(m =>
      m.id === msgId ? { ...m, creating: false, created: true } : m
    ));
  };

  const formatText = (text: string) =>
    text
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\n/g, '<br/>');

  return (
    <>
      {/* ── Floating button ─────────────────────────────────────────────── */}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-2">
        {/* Tooltip bubble when closed */}
        {!open && pulse && (
          <div className="bg-[var(--c-card)] border border-[var(--c-border)] rounded-2xl px-3 py-2 shadow-lg text-xs text-[var(--c-text2)] max-w-[180px] text-right animate-bounce-in">
            💡 Me diga o que criar no Kanban!
          </div>
        )}

        <Tooltip text={open ? 'Fechar assistente' : 'Nex — Assistente IA: crie tarefas em linguagem natural'} side="left">
        <button
          onClick={() => { setOpen(v => !v); setPulse(false); }}
          className={`relative w-14 h-14 rounded-2xl shadow-2xl flex items-center justify-center transition-all duration-300 ${
            open ? 'bg-[var(--c-card)] border border-[var(--c-border)]' : 'bg-gradient-to-br from-indigo-600 via-violet-600 to-purple-700 hover:scale-110 hover:shadow-indigo-500/40'
          }`}
          style={!open ? { boxShadow: '0 8px 32px rgba(99,102,241,0.45)' } : undefined}
        >
          {/* Pulse ring */}
          {!open && pulse && (
            <span className="absolute inset-0 rounded-2xl bg-indigo-400 opacity-25 animate-ping" />
          )}
          {open ? (
            <ChevronDown size={20} className="text-[var(--c-text2)]" />
          ) : (
            <NexIcon />
          )}
        </button>
        </Tooltip>
      </div>

      {/* ── Chat panel ──────────────────────────────────────────────────── */}
      {open && (
        <div className="fixed bottom-24 right-6 z-50 w-[380px] max-h-[600px] flex flex-col rounded-2xl border border-[var(--c-border)] bg-[var(--c-card)] shadow-2xl overflow-hidden"
          style={{ boxShadow: '0 25px 60px rgba(0,0,0,0.4)' }}>

          {/* Header */}
          <div className="flex items-center gap-3 px-4 py-3 border-b border-[var(--c-border)] bg-gradient-to-r from-indigo-600/10 to-purple-600/10">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-600 via-violet-600 to-purple-700 flex items-center justify-center shrink-0">
              <NexIcon size={18} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-[var(--c-text1)]">Nex — Assistente IA</p>
              <div className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                <span className="text-xs text-[var(--c-text3)]">Powered by Gemini</span>
              </div>
            </div>
            <button onClick={() => setOpen(false)}
              className="p-1.5 rounded-lg text-[var(--c-text3)] hover:bg-[var(--c-hover)] transition-colors">
              <X size={14} />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 min-h-0" style={{ maxHeight: 400 }}>
            {messages.map(msg => (
              <div key={msg.id} className={`flex gap-2 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                {/* Avatar */}
                {msg.role === 'assistant' && (
                  <div className="w-7 h-7 rounded-xl bg-gradient-to-br from-indigo-600 via-violet-600 to-purple-700 flex items-center justify-center shrink-0 mt-0.5">
                    <NexIcon size={14} />
                  </div>
                )}

                <div className={`flex flex-col gap-2 max-w-[85%] ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                  {/* Bubble */}
                  <div className={`px-3 py-2.5 rounded-2xl text-sm leading-relaxed ${
                    msg.role === 'user'
                      ? 'bg-indigo-600 text-white rounded-tr-sm'
                      : 'bg-[var(--c-elevated)] border border-[var(--c-border)] text-[var(--c-text1)] rounded-tl-sm'
                  }`}>
                    {msg.creating && !msg.text ? (
                      <div className="flex items-center gap-2 text-[var(--c-text3)]">
                        <Loader2 size={14} className="animate-spin" />
                        <span className="text-xs">Pensando...</span>
                        <ThinkingDots />
                      </div>
                    ) : (
                      <p dangerouslySetInnerHTML={{ __html: formatText(msg.text) }} />
                    )}
                  </div>

                  {/* Task preview cards */}
                  {msg.tasks && msg.tasks.length > 0 && !msg.created && (
                    <div className="w-full space-y-1.5">
                      {msg.tasks.map((t, i) => (
                        <div key={i} className="flex items-center gap-2 px-2.5 py-2 rounded-xl border border-[var(--c-border)] bg-[var(--c-card)] text-xs">
                          <PriorityDot priority={t.priority} />
                          <span className="flex-1 font-medium text-[var(--c-text1)] truncate">{t.title}</span>
                          {t.dueDate && <span className="text-[var(--c-text3)] shrink-0">{t.dueDate}</span>}
                        </div>
                      ))}
                      <button
                        onClick={() => handleCreateTasks(msg.id, msg.tasks!)}
                        disabled={msg.creating}
                        className="w-full flex items-center justify-center gap-2 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold transition-colors disabled:opacity-60"
                      >
                        {msg.creating
                          ? <><Loader2 size={12} className="animate-spin" /> Criando...</>
                          : <><Sparkles size={12} /> Criar {msg.tasks.length} card{msg.tasks.length > 1 ? 's' : ''} no Kanban</>
                        }
                      </button>
                    </div>
                  )}

                  {msg.created && msg.tasks && (
                    <div className="flex items-center gap-1.5 text-xs text-green-400 font-medium">
                      <CheckCircle2 size={13} />
                      {msg.tasks.length} card{msg.tasks.length > 1 ? 's' : ''} criado{msg.tasks.length > 1 ? 's' : ''} no Kanban! 🎉
                    </div>
                  )}
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          {/* Suggestions */}
          {messages.length <= 1 && (
            <div className="px-4 pb-2 flex gap-1.5 overflow-x-auto">
              {SUGGESTIONS.slice(0, 2).map((s, i) => (
                <button key={i} onClick={() => handleSend(s)}
                  className="shrink-0 text-xs px-2.5 py-1.5 rounded-lg border border-[var(--c-border)] text-[var(--c-text3)] hover:text-indigo-400 hover:border-indigo-400/50 transition-colors text-left max-w-[160px] truncate">
                  {s}
                </button>
              ))}
            </div>
          )}

          {/* Input */}
          <div className="p-3 border-t border-[var(--c-border)] flex gap-2 items-end">
            <textarea
              ref={inputRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
              placeholder="Ex: crie 3 tarefas para o lançamento..."
              rows={2}
              className="flex-1 bg-[var(--c-elevated)] border border-[var(--c-border)] rounded-xl px-3 py-2 text-sm text-[var(--c-text1)] placeholder:text-[var(--c-text3)] outline-none focus:border-indigo-400 resize-none transition-colors"
            />
            <button
              onClick={() => handleSend()}
              disabled={!input.trim() || loading}
              className="w-9 h-9 flex items-center justify-center rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white transition-colors disabled:opacity-40 shrink-0"
            >
              {loading ? <Loader2 size={15} className="animate-spin" /> : <Send size={15} />}
            </button>
          </div>
        </div>
      )}
    </>
  );
}

function PriorityDot({ priority }: { priority: Priority }) {
  const colors: Record<Priority, string> = {
    p1: 'bg-red-500', p2: 'bg-orange-400', p3: 'bg-blue-400', p4: 'bg-gray-400',
  };
  return <span className={`w-2 h-2 rounded-full shrink-0 ${colors[priority]}`} />;
}

function NexIcon({ size = 22 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Neural spark — stylized N with sparkle */}
      <circle cx="12" cy="12" r="4" fill="white" fillOpacity="0.9" />
      <circle cx="12" cy="12" r="2" fill="white" />
      {/* Orbiting dots */}
      <circle cx="12" cy="4.5" r="1.5" fill="white" fillOpacity="0.8" />
      <circle cx="19.5" cy="12" r="1.5" fill="white" fillOpacity="0.8" />
      <circle cx="12" cy="19.5" r="1.5" fill="white" fillOpacity="0.8" />
      <circle cx="4.5" cy="12" r="1.5" fill="white" fillOpacity="0.8" />
      {/* Connecting lines */}
      <line x1="12" y1="8" x2="12" y2="6" stroke="white" strokeOpacity="0.5" strokeWidth="1" />
      <line x1="16" y1="12" x2="18" y2="12" stroke="white" strokeOpacity="0.5" strokeWidth="1" />
      <line x1="12" y1="16" x2="12" y2="18" stroke="white" strokeOpacity="0.5" strokeWidth="1" />
      <line x1="8" y1="12" x2="6" y2="12" stroke="white" strokeOpacity="0.5" strokeWidth="1" />
      {/* Diagonal connectors */}
      <line x1="14.8" y1="9.2" x2="16.5" y2="7.5" stroke="white" strokeOpacity="0.3" strokeWidth="0.8" />
      <line x1="14.8" y1="14.8" x2="16.5" y2="16.5" stroke="white" strokeOpacity="0.3" strokeWidth="0.8" />
      <line x1="9.2" y1="14.8" x2="7.5" y2="16.5" stroke="white" strokeOpacity="0.3" strokeWidth="0.8" />
      <line x1="9.2" y1="9.2" x2="7.5" y2="7.5" stroke="white" strokeOpacity="0.3" strokeWidth="0.8" />
    </svg>
  );
}

function ThinkingDots() {
  return (
    <span className="flex gap-0.5 items-center">
      {[0, 1, 2].map(i => (
        <span key={i} className="w-1 h-1 rounded-full bg-[var(--c-text3)] animate-bounce"
          style={{ animationDelay: `${i * 150}ms` }} />
      ))}
    </span>
  );
}
