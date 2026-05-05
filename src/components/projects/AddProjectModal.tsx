import { useState } from 'react';
import { X } from 'lucide-react';
import { useStore } from '../../store/useStore';
import { PROJECT_COLORS } from '../../utils/priority';
import type { ProjectColor } from '../../types';

const COLORS = Object.keys(PROJECT_COLORS) as ProjectColor[];

interface Props { onClose: () => void; }

export function AddProjectModal({ onClose }: Props) {
  const { addProject, setActiveView } = useStore();
  const [name, setName] = useState('');
  const [color, setColor] = useState<ProjectColor>('blue');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    const p = await addProject(name.trim(), color);
    setActiveView({ type: 'project', id: p.id });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm">
      <div className="bg-[var(--c-card)] rounded-2xl shadow-2xl w-96 p-6">
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-semibold text-[var(--c-text1)]">Novo Projeto</h2>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-[var(--c-hover)] text-[var(--c-text3)]">
            <X size={18} />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-[var(--c-text2)] mb-1">Nome</label>
            <input
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: Marketing, Estudos..."
              className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-[var(--c-text2)] mb-2">Cor</label>
            <div className="flex flex-wrap gap-2">
              {COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  className={`w-7 h-7 rounded-full ${PROJECT_COLORS[c].dot} transition-all
                    ${color === c ? 'ring-2 ring-offset-2 ring-gray-400 scale-110' : ''}`}
                />
              ))}
            </div>
          </div>
          <div className="flex gap-2 pt-2">
            <button type="button" onClick={onClose}
              className="flex-1 py-2 rounded-lg border border-[var(--c-border)] text-sm text-[var(--c-text2)] hover:bg-[var(--c-hover)]">
              Cancelar
            </button>
            <button type="submit"
              className="flex-1 py-2 rounded-lg bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700 disabled:opacity-50"
              disabled={!name.trim()}>
              Criar Projeto
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
