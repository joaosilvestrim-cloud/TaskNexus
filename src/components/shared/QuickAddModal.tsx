import { useState, useRef, useEffect } from 'react';
import { X, Check } from 'lucide-react';
import { useStore } from '../../store/useStore';

interface Props {
  open: boolean;
  onClose: () => void;
}

export function QuickAddModal({ open, onClose }: Props) {
  const { addTask } = useStore();
  const [title, setTitle] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setTitle('');
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [open, onClose]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    await addTask({ title: title.trim() });
    setTitle('');
    onClose();
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center" onClick={onClose}>
      <div
        className="w-full max-w-md bg-[var(--c-card)] border border-[var(--c-border)] rounded-2xl shadow-2xl p-5"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-[var(--c-text1)]">Nova tarefa</h2>
          <button onClick={onClose} className="text-[var(--c-text3)] hover:text-[var(--c-text2)]">
            <X size={14} />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-3">
          <input
            ref={inputRef}
            value={title}
            onChange={e => setTitle(e.target.value)}
            placeholder="Nome da tarefa..."
            className="w-full text-sm px-3 py-2.5 rounded-xl border border-[var(--c-border)] bg-[var(--c-elevated)] text-[var(--c-text1)] placeholder-[var(--c-text3)] focus:outline-none focus:ring-2 focus:ring-indigo-400"
          />
          <div className="flex gap-2">
            <button type="button" onClick={onClose}
              className="flex-1 py-2 text-xs rounded-xl border border-[var(--c-border)] text-[var(--c-text2)] hover:bg-[var(--c-hover)]">
              Cancelar
            </button>
            <button type="submit" disabled={!title.trim()}
              className="flex-1 py-2 text-xs rounded-xl bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-40 flex items-center justify-center gap-1">
              <Check size={12} /> Criar tarefa
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
