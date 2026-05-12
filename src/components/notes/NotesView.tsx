import { useState } from 'react';
import { Plus, Search, Trash2, Pin, BookOpen } from 'lucide-react';
import { useStore } from '../../store/useStore';
import { NoteEditor } from './NoteEditor';

const ACCENT_OPTIONS = [
  '#6366f1','#8b5cf6','#ec4899','#ef4444',
  '#f97316','#eab308','#22c55e','#06b6d4','#3b82f6','#64748b',
];

const EMOJI_OPTIONS = ['📝','📌','🗂️','💡','🔗','📊','🚀','⚡','🎯','🔒','📋','🌐','🧠','💼','🏗️'];

export function NotesView() {
  const { knowledgeNotes, addKnowledgeNote, deleteKnowledgeNote, selectedNoteId, setSelectedNote } = useStore();
  const [search, setSearch] = useState('');

  const pinned   = knowledgeNotes.filter(n => n.pinned);
  const unpinned = knowledgeNotes.filter(n => !n.pinned);

  const filter = (list: typeof knowledgeNotes) =>
    list.filter(n =>
      !search ||
      n.title.toLowerCase().includes(search.toLowerCase()) ||
      n.tags.some(t => t.toLowerCase().includes(search.toLowerCase()))
    );

  const fmtDate = (d: string) =>
    new Date(d).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });

  const NoteItem = ({ note }: { note: typeof knowledgeNotes[0] }) => {
    const isSelected = selectedNoteId === note.id;
    return (
      <div
        onClick={() => setSelectedNote(note.id)}
        className={`group flex items-start gap-2 px-2 py-2 rounded-lg cursor-pointer transition-all ${
          isSelected ? 'bg-indigo-500/15' : 'hover:bg-[var(--c-hover)]'
        }`}
      >
        <span className="text-base shrink-0 mt-0.5">{note.emoji}</span>
        <div className="flex-1 min-w-0">
          <p className={`text-sm font-medium truncate ${isSelected ? 'text-indigo-400' : 'text-[var(--c-text1)]'}`}>
            {note.title}
          </p>
          <div className="flex items-center gap-1.5 mt-0.5">
            <span className="text-xs text-[var(--c-text3)]">{fmtDate(note.updatedAt)}</span>
            {note.links.length > 0 && <span className="text-xs text-[var(--c-text3)]">· {note.links.length} link{note.links.length > 1 ? 's' : ''}</span>}
            {note.files.length > 0 && <span className="text-xs text-[var(--c-text3)]">· {note.files.length} arq.</span>}
          </div>
          {note.tags.length > 0 && (
            <div className="flex gap-1 mt-1 flex-wrap">
              {note.tags.slice(0, 3).map(t => (
                <span key={t} className="text-xs px-1.5 py-0.5 rounded-full"
                  style={{ backgroundColor: note.color + '22', color: note.color }}>
                  {t}
                </span>
              ))}
            </div>
          )}
        </div>
        <div className="flex gap-1 opacity-0 group-hover:opacity-100 shrink-0">
          {note.pinned && <Pin size={11} className="text-indigo-400 opacity-100" />}
          <button
            onClick={e => { e.stopPropagation(); if (confirm('Excluir esta nota?')) deleteKnowledgeNote(note.id); }}
            className="text-[var(--c-text3)] hover:text-red-400 transition-colors"
          >
            <Trash2 size={11} />
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="flex h-full overflow-hidden bg-[var(--c-bg)]">

      {/* ── Sidebar ────────────────────────────────────────────────────────── */}
      <div className="w-64 shrink-0 flex flex-col border-r border-[var(--c-border)] bg-[var(--c-sidebar)]">
        <div className="px-3 pt-4 pb-3 space-y-2">
          <div className="flex items-center justify-between px-1">
            <span className="text-xs font-semibold text-[var(--c-text3)] uppercase tracking-wider">Central</span>
            <button
              onClick={addKnowledgeNote}
              className="flex items-center gap-1 text-xs text-indigo-400 hover:text-indigo-300 font-medium transition-colors"
            >
              <Plus size={13} /> Nova
            </button>
          </div>

          <div className="flex items-center gap-2 px-2 py-1.5 bg-[var(--c-hover)] rounded-lg">
            <Search size={12} className="text-[var(--c-text3)] shrink-0" />
            <input
              className="flex-1 bg-transparent text-xs outline-none text-[var(--c-text1)] placeholder:text-[var(--c-text3)]"
              placeholder="Buscar notas..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-2 pb-4 space-y-3">
          {knowledgeNotes.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 gap-2 text-center px-4">
              <BookOpen size={28} className="text-[var(--c-text3)]" />
              <p className="text-xs text-[var(--c-text3)]">Nenhuma nota ainda</p>
            </div>
          ) : (
            <>
              {filter(pinned).length > 0 && (
                <div>
                  <p className="text-xs text-[var(--c-text3)] px-1 mb-1 flex items-center gap-1">
                    <Pin size={10} /> Fixadas
                  </p>
                  <div className="space-y-0.5">
                    {filter(pinned).map(n => <NoteItem key={n.id} note={n} />)}
                  </div>
                </div>
              )}
              {filter(unpinned).length > 0 && (
                <div>
                  {filter(pinned).length > 0 && (
                    <p className="text-xs text-[var(--c-text3)] px-1 mb-1">Todas</p>
                  )}
                  <div className="space-y-0.5">
                    {filter(unpinned).map(n => <NoteItem key={n.id} note={n} />)}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* ── Editor ─────────────────────────────────────────────────────────── */}
      <div className="flex-1 overflow-hidden">
        {selectedNoteId ? (
          <NoteEditor noteId={selectedNoteId} accentOptions={ACCENT_OPTIONS} emojiOptions={EMOJI_OPTIONS} />
        ) : (
          <EmptyState onNew={addKnowledgeNote} />
        )}
      </div>
    </div>
  );
}

function EmptyState({ onNew }: { onNew: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center h-full gap-6 text-center px-8">
      <div className="w-16 h-16 rounded-2xl bg-indigo-500/10 flex items-center justify-center">
        <BookOpen size={30} className="text-indigo-400" />
      </div>
      <div>
        <p className="text-xl font-semibold text-[var(--c-text1)]">Central de Conhecimento</p>
        <p className="text-sm text-[var(--c-text3)] mt-1 max-w-sm">
          Centralize temas importantes: links, documentos, descrições de projeto e anotações.
        </p>
      </div>
      <button
        onClick={onNew}
        className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium rounded-xl transition-colors"
      >
        <Plus size={15} /> Nova Nota
      </button>
    </div>
  );
}
