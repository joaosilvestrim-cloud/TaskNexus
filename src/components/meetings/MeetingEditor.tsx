import { useState, useEffect, useRef } from 'react';
import {
  Calendar, Users, ChevronDown, Trash2, CheckCircle2,
  Circle, ArrowRight, FileText, X, Zap, Tag, Sparkles,
  Wand2, ListChecks, BookOpen, Lightbulb, Loader2,
} from 'lucide-react';
import { useStore } from '../../store/useStore';
import { parseActionItems } from '../../utils/meetingParser';
import { improveNote, extractActionItems, summarizeNote, suggestNextSteps } from '../../lib/gemini';
import type { MeetingNote, MeetingActionItem, Priority } from '../../types';

const PRIORITY_COLOR: Record<Priority, string> = {
  p1: 'text-red-500 border-red-500',
  p2: 'text-orange-400 border-orange-400',
  p3: 'text-blue-400 border-blue-400',
  p4: 'text-gray-400 border-gray-400',
};
const PRIORITY_BG: Record<Priority, string> = {
  p1: 'bg-red-500/10',
  p2: 'bg-orange-400/10',
  p3: 'bg-blue-400/10',
  p4: 'bg-gray-400/10',
};

interface Props { meetingId: string; }

export function MeetingEditor({ meetingId }: Props) {
  const { meetingNotes, updateMeetingNote, convertActionItems, projects } = useStore();
  const meeting = meetingNotes.find((m) => m.id === meetingId);

  const [actionText, setActionText]       = useState('');
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [converting, setConverting]       = useState(false);
  const [showConvertModal, setShowConvertModal] = useState(false);
  const [participantInput, setParticipantInput] = useState('');
  const [activeTab, setActiveTab]         = useState<'notes' | 'actions' | 'ai'>('notes');
  const [aiLoading, setAiLoading]         = useState<string | null>(null); // which action is running
  const [aiSummary, setAiSummary]         = useState<string | null>(null);
  const [aiSuggestions, setAiSuggestions] = useState<string[] | null>(null);
  const [aiError, setAiError]             = useState<string | null>(null);
  const saveTimeout = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => {
    if (meeting) {
      const items = meeting.actionItems;
      const text = items.map(i =>
        `${i.converted ? '[x]' : '[ ]'} ${i.text}${i.dueDate ? ` @prazo:${i.dueDate}` : ''} #${i.priority}`
      ).join('\n');
      setActionText(text || '');
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [meetingId]);

  if (!meeting) return null;

  const update = (changes: Partial<MeetingNote>) => {
    clearTimeout(saveTimeout.current);
    saveTimeout.current = setTimeout(() => {
      updateMeetingNote(meetingId, changes);
    }, 400);
  };

  const handleParseActions = () => {
    const parsed = parseActionItems(actionText);
    // Merge: keep already-converted items, add new ones
    const existing = meeting.actionItems.filter(i => i.converted);
    const merged = [...existing, ...parsed.filter(p =>
      !existing.some(e => e.text === p.text)
    )];
    updateMeetingNote(meetingId, { actionItems: merged });
    setSelectedItems(new Set(merged.filter(i => !i.converted).map(i => i.id)));
  };

  const toggleItem = (id: string) => {
    setSelectedItems(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const handleConvert = async () => {
    const toConvert = [...selectedItems].filter(id =>
      !meeting.actionItems.find(i => i.id === id)?.converted
    );
    if (toConvert.length === 0) return;
    setConverting(true);
    await convertActionItems(meetingId, toConvert);
    setConverting(false);
    setShowConvertModal(false);
    setSelectedItems(new Set());
    setActiveTab('actions');
  };

  const runAI = async (action: string, fn: () => Promise<void>) => {
    setAiLoading(action);
    setAiError(null);
    try { await fn(); }
    catch (e) { setAiError(e instanceof Error ? e.message : 'Erro na IA'); }
    finally { setAiLoading(null); }
  };

  const handleImproveNote = () => runAI('improve', async () => {
    const result = await improveNote({ title: meeting.title, agenda: meeting.agenda, discussion: meeting.discussion, decisions: meeting.decisions });
    updateMeetingNote(meetingId, result);
  });

  const handleExtractActions = () => runAI('extract', async () => {
    const items = await extractActionItems({ title: meeting.title, discussion: meeting.discussion, decisions: meeting.decisions });
    const mapped: MeetingActionItem[] = items.map(i => ({
      id: crypto.randomUUID(),
      text: i.text,
      priority: i.priority,
      dueDate: i.dueDate,
      converted: false,
      taskId: null,
    }));
    const existing = meeting.actionItems.filter(a => a.converted);
    updateMeetingNote(meetingId, { actionItems: [...existing, ...mapped] });
    setActiveTab('actions');
  });

  const handleSummarize = () => runAI('summarize', async () => {
    const summary = await summarizeNote({
      title: meeting.title, date: meeting.date,
      participants: meeting.participants,
      agenda: meeting.agenda, discussion: meeting.discussion, decisions: meeting.decisions,
    });
    setAiSummary(summary);
  });

  const handleSuggest = () => runAI('suggest', async () => {
    const suggestions = await suggestNextSteps({ title: meeting.title, discussion: meeting.discussion, decisions: meeting.decisions });
    setAiSuggestions(suggestions);
  });

  const addParticipant = () => {
    const name = participantInput.trim();
    if (!name) return;
    update({ participants: [...meeting.participants, name] });
    updateMeetingNote(meetingId, { participants: [...meeting.participants, name] });
    setParticipantInput('');
  };

  const removeParticipant = (name: string) => {
    const next = meeting.participants.filter(p => p !== name);
    updateMeetingNote(meetingId, { participants: next });
  };

  const unconvertedCount = meeting.actionItems.filter(i => !i.converted).length;
  const convertedCount   = meeting.actionItems.filter(i => i.converted).length;

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* ── Header ─────────────────────────────────────────────────────── */}
      <div className="px-6 pt-5 pb-4 border-b border-[var(--c-border)] space-y-3">
        {/* Title */}
        <input
          className="w-full text-2xl font-bold bg-transparent text-[var(--c-text1)] outline-none placeholder:text-[var(--c-text3)]"
          placeholder="Título da Reunião"
          defaultValue={meeting.title}
          onChange={e => update({ title: e.target.value })}
        />

        {/* Meta row */}
        <div className="flex flex-wrap items-center gap-4 text-sm text-[var(--c-text2)]">
          {/* Date */}
          <label className="flex items-center gap-1.5 cursor-pointer hover:text-[var(--c-text1)] transition-colors">
            <Calendar size={14} />
            <input
              type="date"
              className="bg-transparent outline-none text-sm text-[var(--c-text2)] cursor-pointer"
              defaultValue={meeting.date}
              onChange={e => update({ date: e.target.value })}
            />
          </label>

          {/* Project */}
          <div className="flex items-center gap-1.5">
            <Tag size={14} />
            <select
              className="bg-transparent outline-none text-sm text-[var(--c-text2)] cursor-pointer"
              defaultValue={meeting.projectId ?? ''}
              onChange={e => updateMeetingNote(meetingId, { projectId: e.target.value || null })}
            >
              <option value="">Sem projeto</option>
              {projects.map(p => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
            <ChevronDown size={12} />
          </div>

          {/* Participants */}
          <div className="flex items-center gap-2 flex-wrap">
            <Users size={14} />
            {meeting.participants.map(p => (
              <span key={p} className="flex items-center gap-1 bg-indigo-500/15 text-indigo-400 text-xs px-2 py-0.5 rounded-full">
                {p}
                <button onClick={() => removeParticipant(p)} className="hover:text-red-400 transition-colors">
                  <X size={10} />
                </button>
              </span>
            ))}
            <input
              className="bg-transparent outline-none text-xs text-[var(--c-text2)] w-24 placeholder:text-[var(--c-text3)]"
              placeholder="+ participante"
              value={participantInput}
              onChange={e => setParticipantInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && addParticipant()}
              onBlur={addParticipant}
            />
          </div>
        </div>
      </div>

      {/* ── Tabs ───────────────────────────────────────────────────────── */}
      <div className="flex border-b border-[var(--c-border)] px-6">
        <button onClick={() => setActiveTab('notes')}
          className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors -mb-px ${activeTab === 'notes' ? 'border-indigo-500 text-indigo-400' : 'border-transparent text-[var(--c-text3)] hover:text-[var(--c-text2)]'}`}>
          📝 Notas
        </button>
        <button onClick={() => setActiveTab('actions')}
          className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors -mb-px ${activeTab === 'actions' ? 'border-indigo-500 text-indigo-400' : 'border-transparent text-[var(--c-text3)] hover:text-[var(--c-text2)]'}`}>
          <span className="flex items-center gap-1.5">
            ✅ Ações
            {unconvertedCount > 0 && (
              <span className="bg-indigo-500 text-white text-xs px-1.5 py-0.5 rounded-full leading-none">{unconvertedCount}</span>
            )}
          </span>
        </button>
        <button onClick={() => setActiveTab('ai')}
          className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors -mb-px flex items-center gap-1.5 ${activeTab === 'ai' ? 'border-purple-500 text-purple-400' : 'border-transparent text-[var(--c-text3)] hover:text-[var(--c-text2)]'}`}>
          <Sparkles size={13} />
          IA Gemini
        </button>
      </div>

      {/* ── Content ────────────────────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto">
        {activeTab === 'notes' ? (
          <div className="p-6 space-y-5">
            {/* Agenda */}
            <Section label="📌 Pauta">
              <textarea
                className="w-full min-h-[80px] bg-transparent text-[var(--c-text1)] text-sm outline-none resize-none placeholder:text-[var(--c-text3)] leading-relaxed"
                placeholder="Tópicos da reunião..."
                defaultValue={meeting.agenda}
                onChange={e => update({ agenda: e.target.value })}
              />
            </Section>

            {/* Discussion */}
            <Section label="💬 Discussão">
              <textarea
                className="w-full min-h-[120px] bg-transparent text-[var(--c-text1)] text-sm outline-none resize-none placeholder:text-[var(--c-text3)] leading-relaxed"
                placeholder="O que foi discutido..."
                defaultValue={meeting.discussion}
                onChange={e => update({ discussion: e.target.value })}
              />
            </Section>

            {/* Decisions */}
            <Section label="🎯 Decisões">
              <textarea
                className="w-full min-h-[80px] bg-transparent text-[var(--c-text1)] text-sm outline-none resize-none placeholder:text-[var(--c-text3)] leading-relaxed"
                placeholder="Decisões tomadas..."
                defaultValue={meeting.decisions}
                onChange={e => update({ decisions: e.target.value })}
              />
            </Section>
          </div>
        ) : activeTab === 'ai' ? (
          <div className="p-6 space-y-4">
            {/* Header */}
            <div className="flex items-center gap-3 p-4 bg-gradient-to-r from-purple-500/10 to-indigo-500/10 border border-purple-500/20 rounded-xl">
              <Sparkles size={20} className="text-purple-400 shrink-0" />
              <div>
                <p className="text-sm font-semibold text-[var(--c-text1)]">Gemini AI</p>
                <p className="text-xs text-[var(--c-text3)]">Use a IA para melhorar, resumir e extrair insights da ata</p>
              </div>
            </div>

            {/* Error */}
            {aiError && (
              <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-sm text-red-400">
                ⚠️ {aiError}
              </div>
            )}

            {/* AI Actions */}
            <div className="grid grid-cols-2 gap-3">
              <AIButton
                icon={<Wand2 size={16} />}
                label="Melhorar Ata"
                desc="Reescreve o texto de forma mais profissional"
                loading={aiLoading === 'improve'}
                onClick={handleImproveNote}
                color="indigo"
              />
              <AIButton
                icon={<ListChecks size={16} />}
                label="Extrair Ações"
                desc="Detecta tarefas automaticamente no texto"
                loading={aiLoading === 'extract'}
                onClick={handleExtractActions}
                color="green"
              />
              <AIButton
                icon={<BookOpen size={16} />}
                label="Resumo Executivo"
                desc="Gera um resumo conciso da reunião"
                loading={aiLoading === 'summarize'}
                onClick={handleSummarize}
                color="blue"
              />
              <AIButton
                icon={<Lightbulb size={16} />}
                label="Sugerir Próximos Passos"
                desc="IA sugere ações estratégicas adicionais"
                loading={aiLoading === 'suggest'}
                onClick={handleSuggest}
                color="yellow"
              />
            </div>

            {/* Summary result */}
            {aiSummary && (
              <div className="space-y-2">
                <p className="text-xs font-semibold text-blue-400 uppercase tracking-wider flex items-center gap-1.5">
                  <BookOpen size={12} /> Resumo Executivo
                </p>
                <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-xl text-sm text-[var(--c-text1)] leading-relaxed whitespace-pre-wrap">
                  {aiSummary}
                </div>
                <button onClick={() => setAiSummary(null)} className="text-xs text-[var(--c-text3)] hover:text-[var(--c-text2)]">
                  Fechar
                </button>
              </div>
            )}

            {/* Suggestions result */}
            {aiSuggestions && (
              <div className="space-y-2">
                <p className="text-xs font-semibold text-yellow-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Lightbulb size={12} /> Próximos Passos Sugeridos
                </p>
                <div className="space-y-2">
                  {aiSuggestions.map((s, i) => (
                    <div key={i} className="flex items-start gap-2 p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-xl">
                      <span className="text-yellow-400 font-bold text-xs mt-0.5">{i + 1}.</span>
                      <p className="text-sm text-[var(--c-text1)] flex-1">{s}</p>
                      <button
                        onClick={() => {
                          const item: MeetingActionItem = {
                            id: crypto.randomUUID(), text: s, priority: 'p3',
                            dueDate: null, converted: false, taskId: null,
                          };
                          updateMeetingNote(meetingId, { actionItems: [...meeting.actionItems, item] });
                          setActiveTab('actions');
                        }}
                        className="shrink-0 text-xs text-yellow-400 hover:text-yellow-300 border border-yellow-500/30 px-2 py-0.5 rounded-lg transition-colors"
                      >
                        + Ação
                      </button>
                    </div>
                  ))}
                </div>
                <button onClick={() => setAiSuggestions(null)} className="text-xs text-[var(--c-text3)] hover:text-[var(--c-text2)]">
                  Fechar
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="p-6 space-y-4">
            {/* Syntax hint */}
            <div className="bg-indigo-500/10 border border-indigo-500/20 rounded-xl p-3 text-xs text-indigo-300 space-y-1">
              <p className="font-semibold text-indigo-400">Sintaxe de ações:</p>
              <p><code className="bg-black/20 px-1 rounded">[ ] Título da tarefa</code> — tarefa simples</p>
              <p><code className="bg-black/20 px-1 rounded">[ ] Tarefa @prazo:15/05 #p1</code> — com prazo e prioridade</p>
              <p><code className="bg-black/20 px-1 rounded">@prazo:amanhã</code> · <code className="bg-black/20 px-1 rounded">@prazo:semana</code> · <code className="bg-black/20 px-1 rounded">@prazo:hoje</code></p>
            </div>

            {/* Action text editor */}
            <textarea
              className="w-full min-h-[140px] bg-[var(--c-hover)] rounded-xl p-3 text-[var(--c-text1)] text-sm outline-none resize-none font-mono placeholder:text-[var(--c-text3)] leading-relaxed border border-[var(--c-border)] focus:border-indigo-500 transition-colors"
              placeholder={`[ ] Criar proposta @prazo:amanhã #p1\n[ ] Agendar reunião @prazo:semana #p2\n[ ] Revisar contrato`}
              value={actionText}
              onChange={e => setActionText(e.target.value)}
            />

            <button
              onClick={handleParseActions}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm rounded-lg transition-colors"
            >
              <Zap size={14} />
              Extrair Ações do Texto
            </button>

            {/* Action items list */}
            {meeting.actionItems.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-medium text-[var(--c-text3)] uppercase tracking-wider">
                    Itens extraídos
                  </p>
                  {convertedCount > 0 && (
                    <span className="text-xs text-green-400">✓ {convertedCount} convertida(s)</span>
                  )}
                </div>

                {meeting.actionItems.map((item) => (
                  <ActionItemRow
                    key={item.id}
                    item={item}
                    selected={selectedItems.has(item.id)}
                    onToggle={() => !item.converted && toggleItem(item.id)}
                    onDelete={() => updateMeetingNote(meetingId, {
                      actionItems: meeting.actionItems.filter(i => i.id !== item.id),
                    })}
                    onUpdate={(changes) => updateMeetingNote(meetingId, {
                      actionItems: meeting.actionItems.map(i => i.id === item.id ? { ...i, ...changes } : i),
                    })}
                  />
                ))}

                {/* Convert button */}
                {selectedItems.size > 0 && (
                  <button
                    onClick={() => setShowConvertModal(true)}
                    className="w-full flex items-center justify-center gap-2 py-2.5 mt-2 bg-green-600 hover:bg-green-500 text-white text-sm font-medium rounded-xl transition-colors"
                  >
                    <ArrowRight size={15} />
                    Converter {selectedItems.size} item(s) em Tarefas
                  </button>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── Convert confirmation modal ─────────────────────────────────── */}
      {showConvertModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-[var(--c-surface)] border border-[var(--c-border)] rounded-2xl p-6 w-full max-w-md shadow-2xl">
            <h3 className="text-lg font-semibold text-[var(--c-text1)] mb-2">Converter em Tarefas</h3>
            <p className="text-sm text-[var(--c-text2)] mb-4">
              {selectedItems.size} item(s) serão criados como tarefas no Kanban
              {meeting.projectId ? ` no projeto "${projects.find(p => p.id === meeting.projectId)?.name}"` : ' (sem projeto)'}.
            </p>

            <div className="space-y-2 mb-5 max-h-48 overflow-y-auto">
              {[...selectedItems].map(id => {
                const item = meeting.actionItems.find(i => i.id === id);
                if (!item) return null;
                return (
                  <div key={id} className={`flex items-center gap-2 p-2 rounded-lg ${PRIORITY_BG[item.priority]}`}>
                    <span className={`text-xs font-bold ${PRIORITY_COLOR[item.priority].split(' ')[0]}`}>
                      {item.priority.toUpperCase()}
                    </span>
                    <span className="text-sm text-[var(--c-text1)] flex-1">{item.text}</span>
                    {item.dueDate && (
                      <span className="text-xs text-[var(--c-text3)]">{item.dueDate}</span>
                    )}
                  </div>
                );
              })}
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowConvertModal(false)}
                className="flex-1 py-2 rounded-xl border border-[var(--c-border)] text-sm text-[var(--c-text2)] hover:bg-[var(--c-hover)] transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleConvert}
                disabled={converting}
                className="flex-1 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium transition-colors disabled:opacity-60"
              >
                {converting ? 'Criando...' : '✅ Confirmar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Sub-components ─────────────────────────────────────────────────────────────

function Section({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <p className="text-xs font-semibold text-[var(--c-text3)] uppercase tracking-wider">{label}</p>
      <div className="bg-[var(--c-hover)] rounded-xl p-3 border border-[var(--c-border)]">
        {children}
      </div>
    </div>
  );
}

function ActionItemRow({
  item, selected, onToggle, onDelete, onUpdate,
}: {
  item: MeetingActionItem;
  selected: boolean;
  onToggle: () => void;
  onDelete: () => void;
  onUpdate: (c: Partial<MeetingActionItem>) => void;
}) {
  const priorityClass = PRIORITY_COLOR[item.priority];

  return (
    <div
      className={`group flex items-center gap-2 p-2.5 rounded-xl border transition-all cursor-pointer ${
        item.converted
          ? 'opacity-50 border-[var(--c-border)] bg-transparent'
          : selected
          ? 'border-indigo-500 bg-indigo-500/10'
          : 'border-[var(--c-border)] hover:border-[var(--c-text3)] bg-[var(--c-hover)]'
      }`}
      onClick={onToggle}
    >
      {item.converted
        ? <CheckCircle2 size={16} className="text-green-400 shrink-0" />
        : <Circle size={16} className={`shrink-0 ${selected ? 'text-indigo-400' : 'text-[var(--c-text3)]'}`} />
      }

      <span className={`flex-1 text-sm ${item.converted ? 'line-through text-[var(--c-text3)]' : 'text-[var(--c-text1)]'}`}>
        {item.text}
      </span>

      {item.dueDate && (
        <span className="text-xs text-[var(--c-text3)] flex items-center gap-1">
          <Calendar size={10} />
          {item.dueDate}
        </span>
      )}

      <select
        className={`text-xs bg-transparent border rounded px-1 py-0.5 ${priorityClass} cursor-pointer`}
        value={item.priority}
        onClick={e => e.stopPropagation()}
        onChange={e => onUpdate({ priority: e.target.value as Priority })}
      >
        <option value="p1">P1</option>
        <option value="p2">P2</option>
        <option value="p3">P3</option>
        <option value="p4">P4</option>
      </select>

      {item.converted && item.taskId && (
        <span className="text-xs text-green-400 flex items-center gap-1">
          <FileText size={10} /> tarefa
        </span>
      )}

      {!item.converted && (
        <button
          onClick={e => { e.stopPropagation(); onDelete(); }}
          className="opacity-0 group-hover:opacity-100 text-[var(--c-text3)] hover:text-red-400 transition-all"
        >
          <Trash2 size={13} />
        </button>
      )}
    </div>
  );
}

const AI_COLORS: Record<string, string> = {
  indigo: 'border-indigo-500/30 hover:bg-indigo-500/10 hover:border-indigo-500/60',
  green:  'border-green-500/30 hover:bg-green-500/10 hover:border-green-500/60',
  blue:   'border-blue-500/30 hover:bg-blue-500/10 hover:border-blue-500/60',
  yellow: 'border-yellow-500/30 hover:bg-yellow-500/10 hover:border-yellow-500/60',
};
const AI_ICON_COLORS: Record<string, string> = {
  indigo: 'text-indigo-400', green: 'text-green-400',
  blue: 'text-blue-400', yellow: 'text-yellow-400',
};

function AIButton({ icon, label, desc, loading, onClick, color }: {
  icon: React.ReactNode; label: string; desc: string;
  loading: boolean; onClick: () => void; color: string;
}) {
  return (
    <button
      onClick={onClick}
      disabled={loading}
      className={`flex flex-col gap-2 p-3 rounded-xl border transition-all text-left disabled:opacity-60 ${AI_COLORS[color]}`}
    >
      <div className={`flex items-center gap-2 ${AI_ICON_COLORS[color]}`}>
        {loading ? <Loader2 size={16} className="animate-spin" /> : icon}
        <span className="text-sm font-medium text-[var(--c-text1)]">{label}</span>
      </div>
      <p className="text-xs text-[var(--c-text3)] leading-relaxed">{desc}</p>
    </button>
  );
}
