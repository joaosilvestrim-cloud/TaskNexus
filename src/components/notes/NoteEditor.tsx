import { useRef, useState } from 'react';
import {
  Pin, Tag, Palette, Link2, Trash2, Plus, ExternalLink,
  Upload, Download, File, Image, FileText, Archive, Music, Film,
  X, Check,
} from 'lucide-react';
import { useStore } from '../../store/useStore';
import type { KnowledgeNote, NoteLink, MeetingFile } from '../../types';

interface Props {
  noteId: string;
  accentOptions: string[];
  emojiOptions: string[];
}

export function NoteEditor({ noteId, accentOptions, emojiOptions }: Props) {
  const { knowledgeNotes, updateKnowledgeNote, projects } = useStore();
  const note = knowledgeNotes.find(n => n.id === noteId);

  const [showColorPicker, setShowColorPicker] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showTagInput, setShowTagInput]       = useState(false);
  const [tagInput, setTagInput]               = useState('');
  const [newLink, setNewLink]                 = useState({ label: '', url: '' });
  const [addingLink, setAddingLink]           = useState(false);
  const [fileDragOver, setFileDragOver]       = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const saveTimer    = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  if (!note) return null;

  const save = (changes: Partial<KnowledgeNote>) => {
    clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => updateKnowledgeNote(noteId, changes), 400);
  };
  const saveNow = (changes: Partial<KnowledgeNote>) => {
    clearTimeout(saveTimer.current);
    updateKnowledgeNote(noteId, changes);
  };

  // ── Links ──────────────────────────────────────────────────────────────────
  const addLink = () => {
    if (!newLink.url.trim()) return;
    const url = newLink.url.startsWith('http') ? newLink.url : 'https://' + newLink.url;
    const link: NoteLink = { id: crypto.randomUUID(), label: newLink.label || url, url };
    saveNow({ links: [...note.links, link] });
    setNewLink({ label: '', url: '' });
    setAddingLink(false);
  };
  const deleteLink = (id: string) => saveNow({ links: note.links.filter(l => l.id !== id) });

  // ── Tags ───────────────────────────────────────────────────────────────────
  const addTag = () => {
    const t = tagInput.trim();
    if (!t || note.tags.includes(t)) return;
    saveNow({ tags: [...note.tags, t] });
    setTagInput('');
    setShowTagInput(false);
  };
  const deleteTag = (t: string) => saveNow({ tags: note.tags.filter(x => x !== t) });

  // ── Files ──────────────────────────────────────────────────────────────────
  const readFileAsDataUrl = (file: File): Promise<MeetingFile> =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload  = () => resolve({
        id: crypto.randomUUID(), name: file.name, size: file.size,
        type: file.type || 'application/octet-stream',
        dataUrl: reader.result as string, uploadedAt: new Date().toISOString(),
      });
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });

  const addFiles = async (fileList: FileList | File[]) => {
    const arr = Array.from(fileList);
    if (!arr.length) return;
    const newFiles = await Promise.all(arr.map(readFileAsDataUrl));
    const current = useStore.getState().knowledgeNotes.find(n => n.id === noteId);
    saveNow({ files: [...(current?.files ?? []), ...newFiles] });
  };

  const deleteFile = (id: string) => saveNow({ files: note.files.filter(f => f.id !== id) });

  const downloadFile = (f: MeetingFile) => {
    const a = document.createElement('a'); a.href = f.dataUrl; a.download = f.name; a.click();
  };

  const fmtSize = (b: number) => b < 1024 ? `${b}B` : b < 1048576 ? `${(b/1024).toFixed(1)}KB` : `${(b/1048576).toFixed(1)}MB`;

  const fileIcon = (type: string) => {
    if (type.startsWith('image/')) return <Image size={16} className="text-blue-400" />;
    if (type.startsWith('audio/')) return <Music size={16} className="text-purple-400" />;
    if (type.startsWith('video/')) return <Film size={16} className="text-pink-400" />;
    if (type.includes('pdf'))      return <FileText size={16} className="text-red-400" />;
    if (type.includes('word') || type.includes('document')) return <FileText size={16} className="text-blue-500" />;
    if (type.includes('zip') || type.includes('rar'))       return <Archive size={16} className="text-amber-400" />;
    return <File size={16} className="text-[var(--c-text3)]" />;
  };

  return (
    <div className="flex flex-col h-full overflow-hidden">

      {/* ── Top bar ──────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between px-6 pt-4 pb-3 border-b border-[var(--c-border)] gap-3"
        style={{ borderTopColor: note.color, borderTopWidth: 3 }}>
        <div className="flex items-center gap-2 flex-wrap">
          {/* Emoji picker */}
          <div className="relative">
            <button onClick={() => setShowEmojiPicker(v => !v)}
              className="text-2xl hover:opacity-70 transition-opacity">
              {note.emoji}
            </button>
            {showEmojiPicker && (
              <div className="absolute top-9 left-0 z-50 bg-[var(--c-card)] border border-[var(--c-border)] rounded-xl p-2 shadow-xl grid grid-cols-5 gap-1">
                {emojiOptions.map(e => (
                  <button key={e} onClick={() => { saveNow({ emoji: e }); setShowEmojiPicker(false); }}
                    className="text-lg p-1 rounded hover:bg-[var(--c-hover)] transition-colors">{e}</button>
                ))}
              </div>
            )}
          </div>

          {/* Project */}
          <select className="bg-transparent outline-none text-xs text-[var(--c-text3)] cursor-pointer hover:text-[var(--c-text2)]"
            value={note.projectId ?? ''} onChange={e => saveNow({ projectId: e.target.value || null })}>
            <option value="">Sem projeto</option>
            {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
        </div>

        <div className="flex items-center gap-1 shrink-0">
          {/* Pin */}
          <button onClick={() => saveNow({ pinned: !note.pinned })}
            title={note.pinned ? 'Desafixar' : 'Fixar'}
            className={`p-1.5 rounded-lg transition-colors ${note.pinned ? 'text-indigo-400 bg-indigo-500/10' : 'text-[var(--c-text3)] hover:bg-[var(--c-hover)]'}`}>
            <Pin size={14} />
          </button>

          {/* Color */}
          <div className="relative">
            <button onClick={() => setShowColorPicker(v => !v)}
              className="p-1.5 rounded-lg text-[var(--c-text3)] hover:bg-[var(--c-hover)] transition-colors">
              <Palette size={14} />
            </button>
            {showColorPicker && (
              <div className="absolute right-0 top-9 z-50 bg-[var(--c-card)] border border-[var(--c-border)] rounded-xl p-3 shadow-xl">
                <div className="flex gap-2 flex-wrap w-32">
                  {accentOptions.map(hex => (
                    <button key={hex} onClick={() => { saveNow({ color: hex }); setShowColorPicker(false); }}
                      className={`w-6 h-6 rounded-full transition-all ${note.color === hex ? 'ring-2 ring-offset-2 ring-white scale-110' : ''}`}
                      style={{ backgroundColor: hex }} />
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Tags */}
          <button onClick={() => setShowTagInput(v => !v)}
            className={`p-1.5 rounded-lg transition-colors ${showTagInput ? 'text-indigo-400 bg-indigo-500/10' : 'text-[var(--c-text3)] hover:bg-[var(--c-hover)]'}`}>
            <Tag size={14} />
          </button>
        </div>
      </div>

      {/* ── Content ──────────────────────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-3xl mx-auto px-8 py-6 space-y-7">

          {/* Title */}
          <input
            className="w-full text-3xl font-bold bg-transparent text-[var(--c-text1)] outline-none placeholder:text-[var(--c-text3)]"
            placeholder="Título da nota"
            defaultValue={note.title}
            onChange={e => save({ title: e.target.value })}
          />

          {/* Tags row */}
          <div className="flex items-center gap-2 flex-wrap -mt-3">
            {note.tags.map(t => (
              <span key={t} className="flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium"
                style={{ backgroundColor: note.color + '22', color: note.color }}>
                {t}
                <button onClick={() => deleteTag(t)} className="hover:opacity-60"><X size={9} /></button>
              </span>
            ))}
            {showTagInput && (
              <div className="flex items-center gap-1">
                <input autoFocus value={tagInput} onChange={e => setTagInput(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') addTag(); if (e.key === 'Escape') setShowTagInput(false); }}
                  placeholder="Nova tag..."
                  className="text-xs bg-[var(--c-hover)] px-2 py-0.5 rounded-full outline-none text-[var(--c-text1)] w-24" />
                <button onClick={addTag} className="text-green-400 hover:text-green-300"><Check size={12} /></button>
              </div>
            )}
          </div>

          {/* Description */}
          <Section color={note.color} emoji="📋" label="Descrição">
            <textarea
              className="w-full min-h-[120px] bg-transparent text-[var(--c-text1)] text-sm outline-none resize-none placeholder:text-[var(--c-text3)] leading-relaxed"
              placeholder="Descreva o tema, contexto, informações importantes..."
              defaultValue={note.description}
              onChange={e => save({ description: e.target.value })}
            />
          </Section>

          {/* Links */}
          <Section color={note.color} emoji="🔗" label="Links">
            <div className="space-y-2">
              {note.links.map(l => (
                <div key={l.id} className="group flex items-center gap-3 px-3 py-2 rounded-lg border border-[var(--c-border)] hover:border-[var(--c-border2)] bg-[var(--c-card)] transition-all">
                  <Link2 size={13} className="text-[var(--c-text3)] shrink-0" />
                  <div className="flex-1 min-w-0">
                    <a href={l.url} target="_blank" rel="noopener noreferrer"
                      onClick={e => e.stopPropagation()}
                      className="text-sm font-medium hover:underline transition-colors"
                      style={{ color: note.color }}>
                      {l.label}
                    </a>
                    <p className="text-xs text-[var(--c-text3)] truncate">{l.url}</p>
                  </div>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                    <a href={l.url} target="_blank" rel="noopener noreferrer"
                      className="p-1 rounded text-[var(--c-text3)] hover:text-indigo-400 transition-colors">
                      <ExternalLink size={12} />
                    </a>
                    <button onClick={() => deleteLink(l.id)}
                      className="p-1 rounded text-[var(--c-text3)] hover:text-red-400 transition-colors">
                      <Trash2 size={12} />
                    </button>
                  </div>
                </div>
              ))}

              {addingLink ? (
                <div className="flex flex-col gap-2 p-3 rounded-xl border border-[var(--c-border2)] bg-[var(--c-elevated)]">
                  <input value={newLink.label} onChange={e => setNewLink(p => ({ ...p, label: e.target.value }))}
                    placeholder="Nome do link (opcional)"
                    className="text-sm bg-transparent outline-none text-[var(--c-text1)] placeholder:text-[var(--c-text3)]" />
                  <input autoFocus value={newLink.url} onChange={e => setNewLink(p => ({ ...p, url: e.target.value }))}
                    onKeyDown={e => { if (e.key === 'Enter') addLink(); if (e.key === 'Escape') setAddingLink(false); }}
                    placeholder="https://..."
                    className="text-sm bg-transparent outline-none text-[var(--c-text1)] placeholder:text-[var(--c-text3)] border-t border-[var(--c-border)] pt-2" />
                  <div className="flex gap-2 mt-1">
                    <button onClick={addLink}
                      className="px-3 py-1 text-xs rounded-lg text-white font-medium transition-colors"
                      style={{ backgroundColor: note.color }}>
                      Adicionar
                    </button>
                    <button onClick={() => { setAddingLink(false); setNewLink({ label: '', url: '' }); }}
                      className="px-3 py-1 text-xs rounded-lg text-[var(--c-text3)] hover:text-[var(--c-text2)] transition-colors">
                      Cancelar
                    </button>
                  </div>
                </div>
              ) : (
                <button onClick={() => setAddingLink(true)}
                  className="flex items-center gap-2 text-xs text-[var(--c-text3)] hover:text-[var(--c-text2)] transition-colors py-1">
                  <Plus size={13} /> Adicionar link
                </button>
              )}
            </div>
          </Section>

          {/* Files */}
          <Section color={note.color} emoji="📁" label="Arquivos">
            {/* Drop zone */}
            <div
              onDragOver={e => { e.preventDefault(); setFileDragOver(true); }}
              onDragLeave={() => setFileDragOver(false)}
              onDrop={e => { e.preventDefault(); setFileDragOver(false); if (e.dataTransfer.files.length) addFiles(e.dataTransfer.files); }}
              onClick={() => fileInputRef.current?.click()}
              className={`flex items-center justify-center gap-2 py-3 mb-3 rounded-xl border-2 border-dashed cursor-pointer transition-all text-xs ${
                fileDragOver ? 'border-indigo-400 bg-indigo-500/10 text-indigo-400'
                  : 'border-[var(--c-border)] text-[var(--c-text3)] hover:border-indigo-400/50'
              }`}
            >
              <Upload size={13} /> Arraste ou clique para anexar arquivos
            </div>
            <input ref={fileInputRef} type="file" multiple className="hidden"
              onChange={e => e.target.files && addFiles(e.target.files)} />

            {note.files.length > 0 && (
              <div className="grid grid-cols-2 gap-2">
                {note.files.map(f => (
                  <div key={f.id} className="group flex items-center gap-2.5 px-3 py-2 rounded-xl border border-[var(--c-border)] bg-[var(--c-card)] hover:border-[var(--c-border2)] transition-all">
                    {f.type.startsWith('image/') ? (
                      <img src={f.dataUrl} alt={f.name} className="w-8 h-8 rounded-lg object-cover shrink-0 border border-[var(--c-border)]" />
                    ) : (
                      <div className="w-8 h-8 rounded-lg bg-[var(--c-hover)] flex items-center justify-center shrink-0">
                        {fileIcon(f.type)}
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-[var(--c-text1)] truncate">{f.name}</p>
                      <p className="text-xs text-[var(--c-text3)]">{fmtSize(f.size)}</p>
                    </div>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                      <button onClick={() => downloadFile(f)} className="w-6 h-6 flex items-center justify-center rounded hover:bg-[var(--c-hover)] text-[var(--c-text3)] hover:text-indigo-400 transition-colors">
                        <Download size={11} />
                      </button>
                      <button onClick={() => deleteFile(f.id)} className="w-6 h-6 flex items-center justify-center rounded hover:bg-red-500/10 text-[var(--c-text3)] hover:text-red-400 transition-colors">
                        <Trash2 size={11} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Section>

        </div>
      </div>
    </div>
  );
}

function Section({ emoji, label, color, children }: { emoji: string; label: string; color: string; children: React.ReactNode }) {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <span className="text-base">{emoji}</span>
        <p className="text-xs font-semibold uppercase tracking-wider" style={{ color }}>{label}</p>
        <div className="flex-1 h-px" style={{ backgroundColor: color + '30' }} />
      </div>
      <div className="pl-1">{children}</div>
    </div>
  );
}
