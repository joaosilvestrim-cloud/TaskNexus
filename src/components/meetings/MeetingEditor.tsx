import { useState, useEffect, useRef, useCallback } from 'react';
import mammoth from 'mammoth';
import {
  Calendar, Users, X, Zap, ArrowRight, CheckCircle2,
  Circle, Trash2, FileText, Upload, Sparkles,
  Wand2, ListChecks, BookOpen, Lightbulb, Loader2, Tag, ChevronDown,
  LayoutGrid,
} from 'lucide-react';
import { useStore } from '../../store/useStore';
import { parseActionItems } from '../../utils/meetingParser';
import { improveNote, extractActionItems, summarizeNote, suggestNextSteps } from '../../lib/gemini';
import type { MeetingNote, MeetingActionItem, Priority } from '../../types';

const P_COLOR: Record<Priority, string> = {
  p1: 'text-red-500', p2: 'text-orange-400', p3: 'text-blue-400', p4: 'text-gray-400',
};

interface Props { meetingId: string; }

export function MeetingEditor({ meetingId }: Props) {
  const { meetingNotes, updateMeetingNote, convertActionItems, projects, setActiveView } = useStore();
  const meeting = meetingNotes.find(m => m.id === meetingId);

  const [participantInput, setParticipantInput] = useState('');
  const [showAI, setShowAI]                     = useState(false);
  const [showConvert, setShowConvert]            = useState(false);
  const [showUpload, setShowUpload]              = useState(false);
  const [selectedItems, setSelectedItems]        = useState<Set<string>>(new Set());
  const [aiLoading, setAiLoading]               = useState<string | null>(null);
  const [aiError, setAiError]                   = useState<string | null>(null);
  const [aiSummary, setAiSummary]               = useState<string | null>(null);
  const [aiSuggestions, setAiSuggestions]       = useState<string[] | null>(null);
  const [converting, setConverting]             = useState(false);
  const [dragOver, setDragOver]                 = useState(false);
  const [uploadProcessing, setUploadProcessing] = useState(false);
  const [uploadDone, setUploadDone]             = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const saveTimer    = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => {
    setSelectedItems(new Set());
    setAiSummary(null);
    setAiSuggestions(null);
    setAiError(null);
    setShowAI(false);
  }, [meetingId]);

  if (!meeting) return null;

  const save = (changes: Partial<MeetingNote>) => {
    clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => updateMeetingNote(meetingId, changes), 400);
  };

  const saveNow = (changes: Partial<MeetingNote>) => {
    clearTimeout(saveTimer.current);
    updateMeetingNote(meetingId, changes);
  };

  // ── Participants ───────────────────────────────────────────────────────────
  const addParticipant = () => {
    const name = participantInput.trim();
    if (!name) return;
    saveNow({ participants: [...meeting.participants, name] });
    setParticipantInput('');
  };

  // ── AI helpers ─────────────────────────────────────────────────────────────
  const runAI = async (key: string, fn: () => Promise<void>) => {
    setAiLoading(key); setAiError(null);
    try { await fn(); }
    catch (e) { setAiError(e instanceof Error ? e.message : 'Erro na IA'); }
    finally { setAiLoading(null); }
  };

  const handleImprove = () => runAI('improve', async () => {
    const r = await improveNote({ title: meeting.title, agenda: meeting.agenda, discussion: meeting.discussion, decisions: meeting.decisions });
    saveNow(r);
  });

  const handleExtract = () => runAI('extract', async () => {
    const items = await extractActionItems({ title: meeting.title, discussion: meeting.discussion, decisions: meeting.decisions });
    const mapped: MeetingActionItem[] = items.map(i => ({
      id: crypto.randomUUID(), text: i.text, priority: i.priority,
      dueDate: i.dueDate, converted: false, taskId: null,
    }));
    const existing = meeting.actionItems.filter(a => a.converted);
    saveNow({ actionItems: [...existing, ...mapped] });
    setSelectedItems(new Set(mapped.map(i => i.id)));
  });

  const handleSummarize = () => runAI('summarize', async () => {
    const s = await summarizeNote({ title: meeting.title, date: meeting.date, participants: meeting.participants, agenda: meeting.agenda, discussion: meeting.discussion, decisions: meeting.decisions });
    setAiSummary(s);
  });

  const handleSuggest = () => runAI('suggest', async () => {
    const s = await suggestNextSteps({ title: meeting.title, discussion: meeting.discussion, decisions: meeting.decisions });
    setAiSuggestions(s);
  });

  // ── Transcript upload ──────────────────────────────────────────────────────
  const processTranscript = useCallback(async (text: string, filename: string) => {
    setUploadProcessing(true);
    setUploadDone(false);
    try {
      // Use Gemini to parse the transcript into meeting structure
      const { improveNote: _, ...rest } = await import('../../lib/gemini');
      const { ask } = rest as unknown as { ask?: never };
      void ask; // unused

      // Call Gemini directly with a special prompt
      const API_KEY = import.meta.env.VITE_GEMINI_API_KEY as string;
      const today = new Date().toISOString().split('T')[0];

      const prompt = `Você recebeu a transcrição de uma reunião (arquivo: ${filename}).
Analise o conteúdo e extraia as informações estruturadas da ata.
Data de hoje: ${today}

TRANSCRIÇÃO:
${text.slice(0, 8000)}

Retorne APENAS um JSON válido com esta estrutura exata:
{
  "title": "título curto e descritivo da reunião (máx 60 chars)",
  "participants": ["Nome1", "Nome2"],
  "agenda": "pauta estruturada da reunião",
  "discussion": "resumo da discussão principal",
  "decisions": "decisões tomadas durante a reunião",
  "actionItems": [
    {"text": "título da tarefa", "priority": "p1", "dueDate": "YYYY-MM-DD ou null"}
  ]
}

Sem markdown, sem explicações, apenas o JSON.`;

      const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${API_KEY}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }),
      });

      const data = await res.json();
      const raw = data.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
      const cleaned = raw.replace(/```json|```/g, '').trim();
      const parsed = JSON.parse(cleaned);

      const newItems: MeetingActionItem[] = (parsed.actionItems ?? []).map((i: { text: string; priority: Priority; dueDate: string | null }) => ({
        id: crypto.randomUUID(), text: i.text, priority: i.priority ?? 'p3',
        dueDate: i.dueDate ?? null, converted: false, taskId: null,
      }));

      saveNow({
        title: parsed.title || meeting.title,
        participants: parsed.participants ?? meeting.participants,
        agenda: parsed.agenda || meeting.agenda,
        discussion: parsed.discussion || meeting.discussion,
        decisions: parsed.decisions || meeting.decisions,
        actionItems: [...meeting.actionItems.filter(a => a.converted), ...newItems],
      });

      setUploadDone(true);
      setShowUpload(false);
      setTimeout(() => setUploadDone(false), 3000);
    } catch (e) {
      console.error('[upload]', e);
    } finally {
      setUploadProcessing(false);
    }
  }, [meetingId, meeting]);

  const handleFile = async (file: File) => {
    if (!file) return;
    let text = '';
    if (file.name.endsWith('.docx')) {
      // Extract plain text from Word document
      const arrayBuffer = await file.arrayBuffer();
      const result = await mammoth.extractRawText({ arrayBuffer });
      text = result.value;
    } else {
      text = await file.text();
    }
    await processTranscript(text, file.name);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault(); setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  // ── Convert to tasks ───────────────────────────────────────────────────────
  const handleConvert = async () => {
    const ids = [...selectedItems].filter(id => !meeting.actionItems.find(i => i.id === id)?.converted);
    if (!ids.length) return;
    setConverting(true);
    await convertActionItems(meetingId, ids);
    setConverting(false);
    setShowConvert(false);
    setSelectedItems(new Set());
  };

  const unconverted = meeting.actionItems.filter(i => !i.converted);
  const converted   = meeting.actionItems.filter(i => i.converted);

  return (
    <div className="flex flex-col h-full overflow-hidden relative">

      {/* ── Top bar ──────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between px-6 pt-4 pb-2 border-b border-[var(--c-border)] gap-3">
        <div className="flex items-center gap-3 flex-wrap">
          {/* Date */}
          <label className="flex items-center gap-1.5 text-xs text-[var(--c-text3)] hover:text-[var(--c-text2)] cursor-pointer transition-colors">
            <Calendar size={13} />
            <input type="date" className="bg-transparent outline-none text-xs cursor-pointer"
              defaultValue={meeting.date} onChange={e => save({ date: e.target.value })} />
          </label>

          {/* Project */}
          <div className="flex items-center gap-1 text-xs text-[var(--c-text3)]">
            <Tag size={12} />
            <select className="bg-transparent outline-none text-xs cursor-pointer hover:text-[var(--c-text2)] transition-colors"
              defaultValue={meeting.projectId ?? ''} onChange={e => saveNow({ projectId: e.target.value || null })}>
              <option value="">Sem projeto</option>
              {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
            <ChevronDown size={10} />
          </div>

          {/* Participants */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <Users size={12} className="text-[var(--c-text3)]" />
            {meeting.participants.map(p => (
              <span key={p} className="flex items-center gap-1 bg-indigo-500/10 text-indigo-400 text-xs px-2 py-0.5 rounded-full">
                {p}
                <button onClick={() => saveNow({ participants: meeting.participants.filter(x => x !== p) })}
                  className="hover:text-red-400 transition-colors"><X size={9} /></button>
              </span>
            ))}
            <input className="bg-transparent outline-none text-xs text-[var(--c-text3)] w-20 placeholder:text-[var(--c-text3)]"
              placeholder="+ pessoa" value={participantInput} onChange={e => setParticipantInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && addParticipant()} onBlur={addParticipant} />
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-2 shrink-0">
          {uploadDone && (
            <span className="text-xs text-green-400 flex items-center gap-1">
              <CheckCircle2 size={12} /> Transcrição importada!
            </span>
          )}
          {/* Kanban card badge */}
          {meeting.linkedTaskId && (
            <button
              onClick={() => setActiveView('kanban')}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs border border-indigo-500/30 bg-indigo-500/10 text-indigo-400 hover:bg-indigo-500/20 transition-colors"
              title="Ver card no Kanban"
            >
              <LayoutGrid size={12} /> Card criado no Kanban
            </button>
          )}
          <button onClick={() => setShowUpload(v => !v)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors border ${
              showUpload ? 'bg-blue-500/15 border-blue-500/30 text-blue-400' : 'border-[var(--c-border)] text-[var(--c-text3)] hover:bg-[var(--c-hover)]'
            }`}>
            <Upload size={13} /> Upload
          </button>
          <button onClick={() => setShowAI(v => !v)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors border ${
              showAI ? 'bg-purple-500/15 border-purple-500/30 text-purple-400' : 'border-[var(--c-border)] text-[var(--c-text3)] hover:bg-[var(--c-hover)]'
            }`}>
            <Sparkles size={13} /> IA Gemini
          </button>
        </div>
      </div>

      {/* ── Upload panel ─────────────────────────────────────────────────── */}
      {showUpload && (
        <div className="px-6 py-3 border-b border-[var(--c-border)] bg-blue-500/5">
          <div
            onDragOver={e => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`flex flex-col items-center justify-center gap-2 py-6 rounded-xl border-2 border-dashed cursor-pointer transition-all ${
              dragOver ? 'border-blue-400 bg-blue-500/10' : 'border-[var(--c-border)] hover:border-blue-400/50 hover:bg-[var(--c-hover)]'
            }`}
          >
            {uploadProcessing ? (
              <>
                <Loader2 size={24} className="animate-spin text-blue-400" />
                <p className="text-sm text-blue-400 font-medium">Gemini processando transcrição...</p>
              </>
            ) : (
              <>
                <Upload size={24} className="text-[var(--c-text3)]" />
                <p className="text-sm font-medium text-[var(--c-text1)]">Arraste ou clique para importar transcrição</p>
                <p className="text-xs text-[var(--c-text3)]">.docx · .txt · .vtt · .srt · .md — O Gemini preenche a ata automaticamente</p>
              </>
            )}
          </div>
          <input ref={fileInputRef} type="file" accept=".docx,.txt,.vtt,.srt,.md,.text"
            className="hidden" onChange={e => e.target.files?.[0] && handleFile(e.target.files[0])} />
        </div>
      )}

      {/* ── AI panel ─────────────────────────────────────────────────────── */}
      {showAI && (
        <div className="px-6 py-3 border-b border-[var(--c-border)] bg-purple-500/5">
          {aiError && (
            <div className="mb-3 p-2 bg-red-500/10 border border-red-500/20 rounded-lg text-xs text-red-400">
              ⚠️ {aiError}
            </div>
          )}
          <div className="grid grid-cols-4 gap-2">
            {[
              { key: 'improve',   icon: <Wand2 size={14} />,      label: 'Melhorar texto',    color: 'indigo', fn: handleImprove },
              { key: 'extract',   icon: <ListChecks size={14} />,  label: 'Extrair ações',     color: 'green',  fn: handleExtract },
              { key: 'summarize', icon: <BookOpen size={14} />,    label: 'Resumo executivo',  color: 'blue',   fn: handleSummarize },
              { key: 'suggest',   icon: <Lightbulb size={14} />,   label: 'Próximos passos',   color: 'yellow', fn: handleSuggest },
            ].map(btn => (
              <button key={btn.key} onClick={btn.fn} disabled={!!aiLoading}
                className="flex items-center gap-2 px-3 py-2 rounded-lg border border-[var(--c-border)] hover:bg-[var(--c-hover)] text-[var(--c-text2)] hover:text-[var(--c-text1)] text-xs transition-colors disabled:opacity-50 text-left">
                {aiLoading === btn.key ? <Loader2 size={14} className="animate-spin text-purple-400 shrink-0" /> : <span className="text-purple-400 shrink-0">{btn.icon}</span>}
                <span>{btn.label}</span>
              </button>
            ))}
          </div>

          {/* Results */}
          {aiSummary && (
            <div className="mt-3 p-3 bg-blue-500/10 border border-blue-500/20 rounded-xl text-sm text-[var(--c-text1)] leading-relaxed">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-semibold text-blue-400">📋 Resumo Executivo</span>
                <button onClick={() => setAiSummary(null)} className="text-[var(--c-text3)] hover:text-[var(--c-text2)]"><X size={12} /></button>
              </div>
              <p className="whitespace-pre-wrap text-xs">{aiSummary}</p>
            </div>
          )}
          {aiSuggestions && (
            <div className="mt-3 p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-xl">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-yellow-400">💡 Próximos Passos Sugeridos</span>
                <button onClick={() => setAiSuggestions(null)} className="text-[var(--c-text3)] hover:text-[var(--c-text2)]"><X size={12} /></button>
              </div>
              <div className="space-y-1.5">
                {aiSuggestions.map((s, i) => (
                  <div key={i} className="flex items-start gap-2">
                    <span className="text-yellow-400 text-xs font-bold mt-0.5">{i+1}.</span>
                    <p className="text-xs text-[var(--c-text1)] flex-1">{s}</p>
                    <button onClick={() => {
                      const item: MeetingActionItem = { id: crypto.randomUUID(), text: s, priority: 'p3', dueDate: null, converted: false, taskId: null };
                      saveNow({ actionItems: [...meeting.actionItems, item] });
                    }} className="text-xs text-yellow-400 hover:text-yellow-300 shrink-0 border border-yellow-500/30 px-1.5 py-0.5 rounded transition-colors">
                      + Ação
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Main content ─────────────────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-3xl mx-auto px-8 py-6 space-y-6">

          {/* Title */}
          <input
            className="w-full text-3xl font-bold bg-transparent text-[var(--c-text1)] outline-none placeholder:text-[var(--c-text3)]"
            placeholder="Título da reunião"
            defaultValue={meeting.title}
            onChange={e => save({ title: e.target.value })}
          />

          {/* Sections */}
          <NoteSection emoji="📌" label="Pauta">
            <textarea className="w-full min-h-[80px] bg-transparent text-[var(--c-text1)] text-sm outline-none resize-none placeholder:text-[var(--c-text3)] leading-relaxed"
              placeholder="Tópicos da reunião..." defaultValue={meeting.agenda}
              onChange={e => save({ agenda: e.target.value })} />
          </NoteSection>

          <NoteSection emoji="💬" label="Discussão">
            <textarea className="w-full min-h-[120px] bg-transparent text-[var(--c-text1)] text-sm outline-none resize-none placeholder:text-[var(--c-text3)] leading-relaxed"
              placeholder="O que foi discutido..." defaultValue={meeting.discussion}
              onChange={e => save({ discussion: e.target.value })} />
          </NoteSection>

          <NoteSection emoji="🎯" label="Decisões">
            <textarea className="w-full min-h-[80px] bg-transparent text-[var(--c-text1)] text-sm outline-none resize-none placeholder:text-[var(--c-text3)] leading-relaxed"
              placeholder="Decisões tomadas..." defaultValue={meeting.decisions}
              onChange={e => save({ decisions: e.target.value })} />
          </NoteSection>

          {/* Action items */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-[var(--c-text2)]">✅ Itens de Ação</span>
                {unconverted.length > 0 && (
                  <span className="text-xs bg-indigo-500/20 text-indigo-400 px-1.5 py-0.5 rounded-full">{unconverted.length}</span>
                )}
              </div>
              <div className="flex items-center gap-2">
                {selectedItems.size > 0 && (
                  <button onClick={() => setShowConvert(true)}
                    className="flex items-center gap-1.5 px-3 py-1 bg-green-600 hover:bg-green-500 text-white text-xs font-medium rounded-lg transition-colors">
                    <ArrowRight size={12} /> Converter {selectedItems.size} em tarefa(s)
                  </button>
                )}
                <button onClick={() => {
                  const text = `[ ] Nova ação #p3`;
                  const parsed = parseActionItems(text);
                  if (parsed[0]) saveNow({ actionItems: [...meeting.actionItems, parsed[0]] });
                }} className="text-xs text-[var(--c-text3)] hover:text-indigo-400 transition-colors">
                  + Adicionar
                </button>
              </div>
            </div>

            {/* Text input for bulk adding */}
            <ActionTextInput meeting={meeting} onSave={items => saveNow({ actionItems: [...meeting.actionItems.filter(a => a.converted), ...items] })} />

            {/* Items list */}
            {meeting.actionItems.length > 0 && (
              <div className="space-y-1.5">
                {meeting.actionItems.map(item => (
                  <ActionRow
                    key={item.id}
                    item={item}
                    selected={selectedItems.has(item.id)}
                    onToggle={() => {
                      if (item.converted) return;
                      setSelectedItems(prev => { const n = new Set(prev); n.has(item.id) ? n.delete(item.id) : n.add(item.id); return n; });
                    }}
                    onDelete={() => saveNow({ actionItems: meeting.actionItems.filter(i => i.id !== item.id) })}
                    onUpdate={c => saveNow({ actionItems: meeting.actionItems.map(i => i.id === item.id ? { ...i, ...c } : i) })}
                  />
                ))}
              </div>
            )}

            {converted.length > 0 && (
              <p className="text-xs text-green-400 flex items-center gap-1">
                <CheckCircle2 size={11} /> {converted.length} tarefa(s) já convertida(s) no Kanban
              </p>
            )}
          </div>
        </div>
      </div>

      {/* ── Convert modal ─────────────────────────────────────────────────── */}
      {showConvert && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-[var(--c-surface)] border border-[var(--c-border)] rounded-2xl p-6 w-full max-w-sm shadow-2xl">
            <h3 className="font-semibold text-[var(--c-text1)] mb-1">Converter em Tarefas</h3>
            <p className="text-sm text-[var(--c-text2)] mb-4">
              {selectedItems.size} item(s) → Kanban{meeting.projectId ? ` · ${projects.find(p => p.id === meeting.projectId)?.name}` : ''}
            </p>
            <div className="space-y-1.5 mb-5 max-h-48 overflow-y-auto">
              {[...selectedItems].map(id => {
                const item = meeting.actionItems.find(i => i.id === id);
                if (!item) return null;
                return (
                  <div key={id} className="flex items-center gap-2 text-sm">
                    <span className={`text-xs font-bold ${P_COLOR[item.priority]}`}>{item.priority.toUpperCase()}</span>
                    <span className="text-[var(--c-text1)]">{item.text}</span>
                  </div>
                );
              })}
            </div>
            <div className="flex gap-2">
              <button onClick={() => setShowConvert(false)}
                className="flex-1 py-2 rounded-xl border border-[var(--c-border)] text-sm text-[var(--c-text2)] hover:bg-[var(--c-hover)] transition-colors">
                Cancelar
              </button>
              <button onClick={handleConvert} disabled={converting}
                className="flex-1 py-2 rounded-xl bg-green-600 hover:bg-green-500 text-white text-sm font-medium transition-colors disabled:opacity-60">
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

function NoteSection({ emoji, label, children }: { emoji: string; label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <p className="text-xs font-semibold text-[var(--c-text3)] flex items-center gap-1.5">
        <span>{emoji}</span> {label.toUpperCase()}
      </p>
      <div className="border-l-2 border-[var(--c-border)] pl-4">
        {children}
      </div>
    </div>
  );
}

function ActionTextInput({ meeting, onSave }: { meeting: MeetingNote; onSave: (items: MeetingActionItem[]) => void }) {
  const [open, setOpen] = useState(false);
  const [text, setText] = useState('');

  const handle = () => {
    const parsed = parseActionItems(text);
    if (parsed.length) {
      onSave([...meeting.actionItems.filter(a => a.converted), ...parsed]);
      setText('');
      setOpen(false);
    }
  };

  if (!open) return (
    <button onClick={() => setOpen(true)}
      className="flex items-center gap-1.5 text-xs text-[var(--c-text3)] hover:text-indigo-400 transition-colors">
      <Zap size={11} /> Adicionar via texto rápido
    </button>
  );

  return (
    <div className="space-y-2">
      <textarea
        autoFocus
        className="w-full min-h-[80px] bg-[var(--c-hover)] border border-[var(--c-border)] focus:border-indigo-500 rounded-xl p-3 text-sm font-mono text-[var(--c-text1)] outline-none resize-none placeholder:text-[var(--c-text3)] transition-colors"
        placeholder={`[ ] Tarefa simples\n[ ] Tarefa com prazo @prazo:amanhã #p1\n[ ] Outra tarefa #p2`}
        value={text}
        onChange={e => setText(e.target.value)}
      />
      <div className="flex gap-2">
        <button onClick={handle} className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs rounded-lg transition-colors">
          Extrair ações
        </button>
        <button onClick={() => { setOpen(false); setText(''); }} className="px-3 py-1.5 text-xs text-[var(--c-text3)] hover:text-[var(--c-text2)] transition-colors">
          Cancelar
        </button>
      </div>
    </div>
  );
}

function ActionRow({ item, selected, onToggle, onDelete, onUpdate }: {
  item: MeetingActionItem; selected: boolean;
  onToggle: () => void; onDelete: () => void; onUpdate: (c: Partial<MeetingActionItem>) => void;
}) {
  return (
    <div
      onClick={onToggle}
      className={`group flex items-center gap-2.5 px-3 py-2 rounded-lg border cursor-pointer transition-all ${
        item.converted ? 'opacity-40 border-transparent' :
        selected ? 'border-indigo-500/50 bg-indigo-500/8' :
        'border-transparent hover:border-[var(--c-border)] hover:bg-[var(--c-hover)]'
      }`}
    >
      {item.converted
        ? <CheckCircle2 size={15} className="text-green-400 shrink-0" />
        : <Circle size={15} className={`shrink-0 ${selected ? 'text-indigo-400' : 'text-[var(--c-text3)]'}`} />
      }
      <span className={`flex-1 text-sm ${item.converted ? 'line-through text-[var(--c-text3)]' : 'text-[var(--c-text1)]'}`}>
        {item.text}
      </span>
      {item.dueDate && (
        <span className="text-xs text-[var(--c-text3)] flex items-center gap-1 shrink-0">
          <Calendar size={10} />{item.dueDate}
        </span>
      )}
      <select
        value={item.priority}
        onClick={e => e.stopPropagation()}
        onChange={e => onUpdate({ priority: e.target.value as Priority })}
        className={`text-xs bg-transparent border-0 outline-none cursor-pointer shrink-0 font-bold ${P_COLOR[item.priority]}`}
      >
        <option value="p1">P1</option><option value="p2">P2</option>
        <option value="p3">P3</option><option value="p4">P4</option>
      </select>
      {item.converted && <FileText size={11} className="text-green-400 shrink-0" />}
      {!item.converted && (
        <button onClick={e => { e.stopPropagation(); onDelete(); }}
          className="opacity-0 group-hover:opacity-100 text-[var(--c-text3)] hover:text-red-400 transition-all">
          <Trash2 size={12} />
        </button>
      )}
    </div>
  );
}
