import { useState, useRef } from 'react';
import {
  Plus, FileText, Trash2, Search, Upload,
  Calendar, ChevronRight, CheckCircle2, Sparkles,
} from 'lucide-react';
import { useStore } from '../../store/useStore';
import { MeetingEditor } from './MeetingEditor';
import type { MeetingTemplate } from '../../types';

const TEMPLATES: { id: MeetingTemplate; icon: string; label: string }[] = [
  { id: 'blank',         icon: '📄', label: 'Em branco' },
  { id: 'client',        icon: '🤝', label: 'Cliente' },
  { id: 'daily',         icon: '☀️', label: 'Daily' },
  { id: 'sprint',        icon: '🚀', label: 'Sprint' },
  { id: 'retrospective', icon: '🔄', label: 'Retro' },
];

export function MeetingsView() {
  const {
    meetingNotes, addMeetingNote, deleteMeetingNote,
    selectedMeetingId, setSelectedMeeting,
  } = useStore();

  const [search, setSearch] = useState('');
  const [showTemplates, setShowTemplates] = useState(false);
  const dropRef = useRef<HTMLDivElement>(null);

  const handleNew = (template: MeetingTemplate = 'blank') => {
    addMeetingNote(template);
    setShowTemplates(false);
  };

  const sorted = [...meetingNotes]
    .filter(m => !search || m.title.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const fmtDate = (d: string) =>
    new Date(d).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });

  return (
    <div className="flex h-full overflow-hidden bg-[var(--c-bg)]">

      {/* ── Left panel ─────────────────────────────────────────────── */}
      <div className="w-64 shrink-0 flex flex-col border-r border-[var(--c-border)] bg-[var(--c-sidebar)]">

        {/* Header */}
        <div className="px-3 pt-4 pb-3 space-y-2">
          <div className="flex items-center justify-between px-1">
            <span className="text-xs font-semibold text-[var(--c-text3)] uppercase tracking-wider">Atas</span>
            <button
              onClick={() => setShowTemplates(v => !v)}
              className="flex items-center gap-1 text-xs text-indigo-400 hover:text-indigo-300 font-medium transition-colors"
            >
              <Plus size={13} /> Nova
            </button>
          </div>

          {/* Template picker inline */}
          {showTemplates && (
            <div className="bg-[var(--c-surface)] border border-[var(--c-border)] rounded-xl overflow-hidden shadow-lg">
              {TEMPLATES.map(t => (
                <button
                  key={t.id}
                  onClick={() => handleNew(t.id)}
                  className="w-full flex items-center gap-2.5 px-3 py-2 text-sm hover:bg-[var(--c-hover)] text-[var(--c-text1)] transition-colors text-left"
                >
                  <span>{t.icon}</span>
                  <span>{t.label}</span>
                </button>
              ))}
            </div>
          )}

          {/* Search */}
          <div className="flex items-center gap-2 px-2 py-1.5 bg-[var(--c-hover)] rounded-lg">
            <Search size={12} className="text-[var(--c-text3)] shrink-0" />
            <input
              className="flex-1 bg-transparent text-xs outline-none text-[var(--c-text1)] placeholder:text-[var(--c-text3)]"
              placeholder="Buscar atas..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto px-2 pb-4 space-y-0.5">
          {sorted.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 gap-2 text-center px-4">
              <FileText size={28} className="text-[var(--c-text3)]" />
              <p className="text-xs text-[var(--c-text3)]">Nenhuma ata ainda</p>
            </div>
          ) : sorted.map(m => {
            const unconverted = m.actionItems.filter(i => !i.converted).length;
            const isSelected  = selectedMeetingId === m.id;
            return (
              <div
                key={m.id}
                onClick={() => setSelectedMeeting(m.id)}
                className={`group flex items-start gap-2 px-2 py-2 rounded-lg cursor-pointer transition-all ${
                  isSelected ? 'bg-indigo-500/15 text-indigo-400' : 'hover:bg-[var(--c-hover)] text-[var(--c-text1)]'
                }`}
              >
                <FileText size={14} className={`mt-0.5 shrink-0 ${isSelected ? 'text-indigo-400' : 'text-[var(--c-text3)]'}`} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm truncate font-medium">{m.title}</p>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className="text-xs text-[var(--c-text3)]">{fmtDate(m.date)}</span>
                    {unconverted > 0 && (
                      <span className="text-xs bg-indigo-500/20 text-indigo-400 px-1 rounded">
                        {unconverted}
                      </span>
                    )}
                    {m.actionItems.some(i => i.converted) && (
                      <CheckCircle2 size={10} className="text-green-400" />
                    )}
                  </div>
                </div>
                <button
                  onClick={e => { e.stopPropagation(); if (confirm('Apagar?')) deleteMeetingNote(m.id); }}
                  className="opacity-0 group-hover:opacity-100 p-0.5 text-[var(--c-text3)] hover:text-red-400 transition-all shrink-0 mt-0.5"
                >
                  <Trash2 size={12} />
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Main editor ────────────────────────────────────────────── */}
      <div className="flex-1 overflow-hidden" ref={dropRef}>
        {selectedMeetingId ? (
          <MeetingEditor meetingId={selectedMeetingId} />
        ) : (
          <EmptyState onNew={() => handleNew('blank')} onTemplate={() => setShowTemplates(true)} />
        )}
      </div>
    </div>
  );
}

function EmptyState({ onNew, onTemplate }: { onNew: () => void; onTemplate: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center h-full gap-6 text-center px-8">
      <div className="w-16 h-16 rounded-2xl bg-indigo-500/10 flex items-center justify-center">
        <FileText size={30} className="text-indigo-400" />
      </div>
      <div>
        <p className="text-xl font-semibold text-[var(--c-text1)]">Nenhuma ata selecionada</p>
        <p className="text-sm text-[var(--c-text3)] mt-1">Crie uma nova ata ou selecione uma existente</p>
      </div>
      <div className="flex gap-3">
        <button
          onClick={onNew}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium rounded-xl transition-colors"
        >
          <Plus size={15} /> Nova Ata
        </button>
        <button
          onClick={onTemplate}
          className="flex items-center gap-2 px-4 py-2 border border-[var(--c-border)] text-[var(--c-text2)] hover:bg-[var(--c-hover)] text-sm rounded-xl transition-colors"
        >
          <ChevronRight size={15} /> Usar Template
        </button>
      </div>
      <div className="flex items-center gap-2 text-xs text-[var(--c-text3)] mt-2">
        <Upload size={13} />
        <span>Abra uma ata e use o botão <strong>Upload</strong> para importar transcrições</span>
      </div>
    </div>
  );
}
