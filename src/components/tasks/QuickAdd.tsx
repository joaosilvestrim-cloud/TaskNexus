import { useState, useRef } from 'react';
import { Plus, Sparkles } from 'lucide-react';
import { useStore } from '../../store/useStore';
import { parseNaturalTask } from '../../utils/nlp';
import type { Priority } from '../../types';

interface Props {
  projectId?: string | null;
  sectionId?: string | null;
  placeholder?: string;
}

const PRIORITY_COLORS: Record<Priority, string> = {
  p1: 'text-red-500', p2: 'text-orange-400', p3: 'text-blue-400', p4: 'text-gray-300',
};

export function QuickAdd({ projectId = null, sectionId = null, placeholder }: Props) {
  const { addTask, projects, labels, addLabel } = useStore();
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState('');
  const [parsed, setParsed] = useState<ReturnType<typeof parseNaturalTask> | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleChange = (v: string) => {
    setValue(v);
    if (v.trim().length > 2) {
      setParsed(parseNaturalTask(v));
    } else {
      setParsed(null);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!value.trim()) { setOpen(false); return; }

    const p = parseNaturalTask(value);
    if (!p.title) { setOpen(false); return; }

    // Resolve project
    let resolvedProjectId = projectId;
    if (p.projectName) {
      const found = projects.find(
        (pr) => pr.name.toLowerCase() === p.projectName!.toLowerCase(),
      );
      if (found) resolvedProjectId = found.id;
    }

    // Resolve labels
    const labelIds: string[] = [];
    for (const name of p.labelNames) {
      const found = labels.find((l) => l.name.toLowerCase() === name.toLowerCase());
      if (found) {
        labelIds.push(found.id);
      } else {
        const newLabel = addLabel(name, '#6366f1');
        labelIds.push(newLabel.id);
      }
    }

    addTask({
      title: p.title,
      projectId: resolvedProjectId,
      sectionId,
      priority: p.priority ?? 'p4',
      labelIds,
      dueDate: p.dueDate ?? null,
      dueTime: p.dueTime ?? null,
      recurrence: p.recurrence ?? { type: 'none' },
    });

    setValue('');
    setParsed(null);
    setOpen(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') { setOpen(false); setValue(''); setParsed(null); }
  };

  if (!open) {
    return (
      <button
        onClick={() => { setOpen(true); setTimeout(() => inputRef.current?.focus(), 50); }}
        className="flex items-center gap-2 w-full px-3 py-2 text-sm text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all group"
      >
        <Plus size={16} className="group-hover:text-indigo-600" />
        {placeholder ?? 'Adicionar tarefa'}
      </button>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-xl border-2 border-indigo-400 bg-white shadow-lg p-3 space-y-2">
      <input
        ref={inputRef}
        value={value}
        onChange={(e) => handleChange(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder='Ex: "Enviar relatório amanhã às 14h #Trabalho @urgente p1"'
        className="w-full text-sm text-gray-800 placeholder-gray-400 focus:outline-none"
      />

      {/* NLP preview */}
      {parsed && (parsed.dueDate || parsed.priority || parsed.projectName || parsed.labelNames.length > 0) && (
        <div className="flex flex-wrap gap-1.5 px-1">
          <span className="flex items-center gap-1 text-xs text-indigo-500">
            <Sparkles size={11} /> Detectado:
          </span>
          {parsed.priority && (
            <span className={`text-xs font-bold ${PRIORITY_COLORS[parsed.priority]}`}>
              {parsed.priority.toUpperCase()}
            </span>
          )}
          {parsed.dueDate && (
            <span className="text-xs bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded-full">
              📅 {parsed.dueDate}
            </span>
          )}
          {parsed.dueTime && (
            <span className="text-xs bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded-full">
              🕐 {parsed.dueTime}
            </span>
          )}
          {parsed.projectName && (
            <span className="text-xs bg-purple-50 text-purple-600 px-1.5 py-0.5 rounded-full">
              #{parsed.projectName}
            </span>
          )}
          {parsed.labelNames.map((l) => (
            <span key={l} className="text-xs bg-green-50 text-green-600 px-1.5 py-0.5 rounded-full">
              @{l}
            </span>
          ))}
        </div>
      )}

      <div className="flex items-center justify-end gap-2 pt-1">
        <button type="button" onClick={() => { setOpen(false); setValue(''); setParsed(null); }}
          className="px-3 py-1.5 text-sm text-gray-500 hover:bg-gray-100 rounded-lg">
          Cancelar
        </button>
        <button type="submit" disabled={!value.trim()}
          className="px-4 py-1.5 text-sm bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 disabled:opacity-40">
          Adicionar
        </button>
      </div>
    </form>
  );
}
