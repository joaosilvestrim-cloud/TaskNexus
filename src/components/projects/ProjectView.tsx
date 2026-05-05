import { useState } from 'react';
import { LayoutList, LayoutGrid, MoreHorizontal, Plus, ChevronDown, ChevronRight, Pencil, Trash2, Check } from 'lucide-react';
import { useStore } from '../../store/useStore';
import { PROJECT_COLORS } from '../../utils/priority';
import { TaskList } from '../tasks/TaskList';
import { KanbanBoard } from './KanbanBoard';
import type { Project } from '../../types';

interface Props { project: Project; }

export function ProjectView({ project }: Props) {
  const {
    sections, tasks, updateProject, deleteProject, setActiveView,
    addSection, updateSection, deleteSection,
  } = useStore();
  const [editingName, setEditingName] = useState(false);
  const [nameVal, setNameVal] = useState(project.name);
  const [newSection, setNewSection] = useState('');
  const [addingSection, setAddingSection] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  const projectSections = sections
    .filter((s) => s.projectId === project.id)
    .sort((a, b) => a.order - b.order);

  const unsectioned = tasks.filter(
    (t) => t.projectId === project.id && !t.sectionId
  ).sort((a, b) => a.order - b.order);

  const colors = PROJECT_COLORS[project.color];

  const handleRename = (e: React.FormEvent) => {
    e.preventDefault();
    if (nameVal.trim()) updateProject(project.id, { name: nameVal.trim() });
    setEditingName(false);
  };

  const handleAddSection = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSection.trim()) return;
    addSection(project.id, newSection.trim());
    setNewSection('');
    setAddingSection(false);
  };

  const handleDelete = () => {
    deleteProject(project.id);
    setActiveView('inbox');
    setMenuOpen(false);
  };

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="max-w-3xl mx-auto w-full py-8 px-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <span className={`w-3 h-3 rounded-full ${colors.dot}`} />
            {editingName ? (
              <form onSubmit={handleRename}>
                <input
                  autoFocus
                  value={nameVal}
                  onChange={(e) => setNameVal(e.target.value)}
                  onBlur={handleRename}
                  className="text-xl font-bold text-[var(--c-text1)] focus:outline-none border-b-2 border-indigo-400 bg-transparent"
                />
              </form>
            ) : (
              <h1
                className="text-xl font-bold text-[var(--c-text1)] cursor-pointer hover:text-indigo-600"
                onDoubleClick={() => { setEditingName(true); setNameVal(project.name); }}
              >
                {project.name}
              </h1>
            )}
          </div>

          <div className="flex items-center gap-1">
            {/* View toggle */}
            <button
              onClick={() => updateProject(project.id, { view: 'list' })}
              className={`p-1.5 rounded-lg transition-all ${project.view === 'list' ? 'bg-indigo-100 text-indigo-600' : 'text-[var(--c-text3)] hover:bg-[var(--c-hover)]'}`}
              title="Visualização em Lista"
            >
              <LayoutList size={16} />
            </button>
            <button
              onClick={() => updateProject(project.id, { view: 'board' })}
              className={`p-1.5 rounded-lg transition-all ${project.view === 'board' ? 'bg-indigo-100 text-indigo-600' : 'text-[var(--c-text3)] hover:bg-[var(--c-hover)]'}`}
              title="Visualização em Quadro (Kanban)"
            >
              <LayoutGrid size={16} />
            </button>

            {/* More menu */}
            <div className="relative">
              <button
                onClick={() => setMenuOpen((v) => !v)}
                className="p-1.5 rounded-lg text-gray-400 hover:bg-[var(--c-hover)]"
              >
                <MoreHorizontal size={16} />
              </button>
              {menuOpen && (
                <div className="absolute right-0 top-8 bg-[var(--c-card)] border border-[var(--c-border)] rounded-xl shadow-lg py-1 w-44 z-20">
                  <button
                    onClick={() => { setEditingName(true); setNameVal(project.name); setMenuOpen(false); }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-sm text-[var(--c-text1)] hover:bg-[var(--c-hover)]"
                  >
                    <Pencil size={14} /> Renomear
                  </button>
                  <button
                    onClick={handleDelete}
                    className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-500 hover:bg-red-50"
                  >
                    <Trash2 size={14} /> Excluir Projeto
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Content */}
        {project.view === 'board' ? (
          <KanbanBoard project={project} />
        ) : (
          <div className="space-y-6">
            {/* Unsectioned tasks */}
            <TaskList
              tasks={unsectioned}
              projectId={project.id}
              sectionId={null}
            />

            {/* Sections */}
            {projectSections.map((sec) => {
              const secTasks = tasks
                .filter((t) => t.projectId === project.id && t.sectionId === sec.id)
                .sort((a, b) => a.order - b.order);

              return (
                <div key={sec.id}>
                  <div className="flex items-center gap-2 mb-2 group">
                    <button
                      onClick={() => updateSection(sec.id, { collapsed: !sec.collapsed })}
                      className="text-[var(--c-text3)] hover:text-[var(--c-text2)]"
                    >
                      {sec.collapsed ? <ChevronRight size={14} /> : <ChevronDown size={14} />}
                    </button>
                    <h3 className="text-sm font-semibold text-[var(--c-text1)]">{sec.name}</h3>
                    <span className="text-xs text-[var(--c-text3)] ml-1">
                      {secTasks.filter((t) => !t.completed).length}
                    </span>
                    <div className="flex-1 h-px bg-[var(--c-border)] ml-2" />
                    <button
                      onClick={() => deleteSection(sec.id)}
                      className="opacity-0 group-hover:opacity-100 p-1 rounded text-gray-300 hover:text-red-400 transition-all"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                  {!sec.collapsed && (
                    <TaskList
                      tasks={secTasks}
                      projectId={project.id}
                      sectionId={sec.id}
                    />
                  )}
                </div>
              );
            })}

            {/* Add section */}
            {addingSection ? (
              <form onSubmit={handleAddSection} className="flex items-center gap-2">
                <input
                  autoFocus
                  value={newSection}
                  onChange={(e) => setNewSection(e.target.value)}
                  onKeyDown={(e) => e.key === 'Escape' && setAddingSection(false)}
                  placeholder="Nome da seção..."
                  className="flex-1 text-sm px-3 py-2 rounded-lg border border-indigo-300 focus:outline-none focus:ring-2 focus:ring-indigo-300"
                />
                <button type="submit" className="p-2 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700">
                  <Check size={14} />
                </button>
                <button type="button" onClick={() => setAddingSection(false)}
                  className="p-2 rounded-lg hover:bg-gray-100 text-gray-400">
                  ✕
                </button>
              </form>
            ) : (
              <button
                onClick={() => setAddingSection(true)}
                className="flex items-center gap-2 text-sm text-[var(--c-text3)] hover:text-indigo-600 transition-colors"
              >
                <Plus size={14} /> Adicionar Seção
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
