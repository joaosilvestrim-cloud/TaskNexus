import { useState } from 'react';
import { Filter, Pencil, Check, X } from 'lucide-react';
import { useStore } from '../../store/useStore';
import { filterTasks } from '../../utils/filters';
import { TaskList } from './TaskList';

interface Props { filterId: string; }

export function FilterView({ filterId }: Props) {
  const { tasks, filters, projects, labels, updateFilter } = useStore();
  const filter = filters.find((f) => f.id === filterId);
  const [editing, setEditing] = useState(false);
  const [queryVal, setQueryVal] = useState(filter?.query ?? '');

  if (!filter) return null;

  const filtered = filterTasks(filter.query, tasks, projects, labels);

  const handleSave = () => {
    updateFilter(filter.id, { query: queryVal });
    setEditing(false);
  };

  return (
    <div className="max-w-2xl mx-auto w-full py-8 px-4">
      <div className="flex items-center gap-3 mb-3">
        <Filter size={22} style={{ color: filter.color }} />
        <h1 className="text-xl font-bold text-gray-900">{filter.name}</h1>
      </div>

      {/* Query editor */}
      <div className="flex items-center gap-2 mb-6 p-3 bg-gray-50 rounded-xl">
        {editing ? (
          <>
            <code className="text-xs text-gray-400 shrink-0">Filtro:</code>
            <input
              autoFocus
              value={queryVal}
              onChange={(e) => setQueryVal(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') handleSave(); if (e.key === 'Escape') setEditing(false); }}
              className="flex-1 text-sm font-mono text-indigo-700 bg-transparent focus:outline-none"
            />
            <button onClick={handleSave} className="p-1 rounded text-green-500 hover:bg-green-50">
              <Check size={14} />
            </button>
            <button onClick={() => setEditing(false)} className="p-1 rounded text-gray-400 hover:bg-gray-100">
              <X size={14} />
            </button>
          </>
        ) : (
          <>
            <code className="text-xs text-gray-400 shrink-0">Filtro:</code>
            <code className="flex-1 text-sm text-indigo-700">{filter.query}</code>
            <button onClick={() => { setEditing(true); setQueryVal(filter.query); }}
              className="p-1 rounded text-gray-400 hover:bg-gray-100">
              <Pencil size={13} />
            </button>
          </>
        )}
      </div>

      <p className="text-sm text-gray-500 mb-4">
        {filtered.length} resultado{filtered.length !== 1 ? 's' : ''}
      </p>

      <TaskList
        tasks={filtered}
        showProject
        showQuickAdd={false}
        emptyMessage="Nenhuma tarefa corresponde a este filtro"
      />
    </div>
  );
}
