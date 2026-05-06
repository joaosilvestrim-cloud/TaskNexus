import { useState } from 'react';
import { Plus, FileText, Trash2, Calendar, CheckCircle2, ChevronRight, LayoutTemplate } from 'lucide-react';
import { useStore } from '../../store/useStore';
import { MeetingEditor } from './MeetingEditor';
import type { MeetingTemplate } from '../../types';

const TEMPLATES: { id: MeetingTemplate; label: string; icon: string; desc: string }[] = [
  { id: 'blank',          label: 'Em branco',        icon: '📄', desc: 'Começar do zero' },
  { id: 'client',         label: 'Reunião de Cliente',icon: '🤝', desc: 'Alinhamento com cliente' },
  { id: 'daily',          label: 'Daily Standup',     icon: '☀️', desc: 'Reunião diária de time' },
  { id: 'sprint',         label: 'Sprint Planning',   icon: '🚀', desc: 'Planejamento de sprint' },
  { id: 'retrospective',  label: 'Retrospectiva',     icon: '🔄', desc: 'Revisão e melhorias' },
];

export function MeetingsView() {
  const {
    meetingNotes, addMeetingNote, deleteMeetingNote,
    selectedMeetingId, setSelectedMeeting,
  } = useStore();

  const [showTemplates, setShowTemplates] = useState(false);

  const handleNew = (template: MeetingTemplate = 'blank') => {
    addMeetingNote(template);
    setShowTemplates(false);
  };

  const sorted = [...meetingNotes].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  return (
    <div className="flex h-full overflow-hidden">
      {/* ── Sidebar list ─────────────────────────────────────────────── */}
      <div className="w-72 shrink-0 border-r border-[var(--c-border)] flex flex-col h-full bg-[var(--c-surface)]">
        {/* Header */}
        <div className="px-4 py-4 border-b border-[var(--c-border)] flex items-center justify-between">
          <div>
            <h2 className="font-semibold text-[var(--c-text1)]">Atas de Reunião</h2>
            <p className="text-xs text-[var(--c-text3)] mt-0.5">{meetingNotes.length} ata(s)</p>
          </div>
          <button
            onClick={() => setShowTemplates(true)}
            className="flex items-center gap-1 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium rounded-lg transition-colors"
          >
            <Plus size={13} />
            Nova
          </button>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto py-2">
          {sorted.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full gap-3 text-center px-6">
              <FileText size={36} className="text-[var(--c-text3)]" />
              <p className="text-sm text-[var(--c-text2)]">Nenhuma ata ainda</p>
              <p className="text-xs text-[var(--c-text3)]">Clique em "Nova" para criar sua primeira ata</p>
            </div>
          ) : (
            sorted.map((m) => {
              const unconverted = m.actionItems.filter(i => !i.converted).length;
              const converted   = m.actionItems.filter(i => i.converted).length;
              const isSelected  = selectedMeetingId === m.id;

              return (
                <div
                  key={m.id}
                  onClick={() => setSelectedMeeting(isSelected ? null : m.id)}
                  className={`group mx-2 mb-1 px-3 py-2.5 rounded-xl cursor-pointer transition-all ${
                    isSelected
                      ? 'bg-indigo-500/15 ring-1 ring-indigo-500/30'
                      : 'hover:bg-[var(--c-hover)]'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-[var(--c-text1)] truncate">{m.title}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="flex items-center gap-1 text-xs text-[var(--c-text3)]">
                          <Calendar size={10} />
                          {m.date}
                        </span>
                        {m.participants.length > 0 && (
                          <span className="text-xs text-[var(--c-text3)]">
                            · {m.participants.length} pessoa(s)
                          </span>
                        )}
                      </div>
                      {m.actionItems.length > 0 && (
                        <div className="flex items-center gap-2 mt-1.5">
                          {unconverted > 0 && (
                            <span className="text-xs bg-indigo-500/15 text-indigo-400 px-1.5 py-0.5 rounded-full">
                              {unconverted} pendente{unconverted > 1 ? 's' : ''}
                            </span>
                          )}
                          {converted > 0 && (
                            <span className="text-xs text-green-400 flex items-center gap-0.5">
                              <CheckCircle2 size={10} />
                              {converted}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-1">
                      <ChevronRight size={14} className={`text-[var(--c-text3)] transition-opacity ${isSelected ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`} />
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (confirm('Apagar esta ata?')) {
                            deleteMeetingNote(m.id);
                          }
                        }}
                        className="opacity-0 group-hover:opacity-100 text-[var(--c-text3)] hover:text-red-400 transition-all p-0.5 rounded"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* ── Editor ───────────────────────────────────────────────────── */}
      <div className="flex-1 overflow-hidden bg-[var(--c-bg)]">
        {selectedMeetingId ? (
          <MeetingEditor meetingId={selectedMeetingId} />
        ) : (
          <div className="flex flex-col items-center justify-center h-full gap-4 text-center px-6">
            <div className="w-16 h-16 rounded-2xl bg-indigo-500/10 flex items-center justify-center">
              <FileText size={32} className="text-indigo-400" />
            </div>
            <div>
              <p className="text-lg font-semibold text-[var(--c-text1)]">Selecione uma ata</p>
              <p className="text-sm text-[var(--c-text2)] mt-1">ou crie uma nova para começar</p>
            </div>
            <button
              onClick={() => setShowTemplates(true)}
              className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium rounded-xl transition-colors"
            >
              <Plus size={16} />
              Nova Ata
            </button>
          </div>
        )}
      </div>

      {/* ── Template picker modal ─────────────────────────────────────── */}
      {showTemplates && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-[var(--c-surface)] border border-[var(--c-border)] rounded-2xl p-6 w-full max-w-md shadow-2xl">
            <div className="flex items-center gap-3 mb-5">
              <LayoutTemplate size={20} className="text-indigo-400" />
              <div>
                <h3 className="text-lg font-semibold text-[var(--c-text1)]">Escolha um template</h3>
                <p className="text-xs text-[var(--c-text3)]">Comece mais rápido com um template pronto</p>
              </div>
            </div>

            <div className="space-y-2">
              {TEMPLATES.map((t) => (
                <button
                  key={t.id}
                  onClick={() => handleNew(t.id)}
                  className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-[var(--c-hover)] transition-colors text-left group"
                >
                  <span className="text-2xl">{t.icon}</span>
                  <div>
                    <p className="text-sm font-medium text-[var(--c-text1)] group-hover:text-indigo-400 transition-colors">{t.label}</p>
                    <p className="text-xs text-[var(--c-text3)]">{t.desc}</p>
                  </div>
                </button>
              ))}
            </div>

            <button
              onClick={() => setShowTemplates(false)}
              className="w-full mt-4 py-2 text-sm text-[var(--c-text3)] hover:text-[var(--c-text2)] transition-colors"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
