import { useStore } from '../../store/useStore';
import { InboxView } from '../tasks/InboxView';
import { TodayView } from '../tasks/TodayView';
import { UpcomingView } from '../tasks/UpcomingView';
import { ProjectView } from '../projects/ProjectView';
import { LabelView } from '../tasks/LabelView';
import { FilterView } from '../tasks/FilterView';
import { TaskDetail } from '../tasks/TaskDetail';
import { KanbanGlobal } from '../kanban/KanbanGlobal';
import { CalendarView } from '../views/CalendarView';
import { FocusMode } from '../views/FocusMode';
import { MobileHeader } from './MobileHeader';
import { MobileNav } from './MobileNav';

interface Props {
  onSearchOpen: () => void;
}

export function MainContent({ onSearchOpen }: Props) {
  const { activeView, projects, selectedTaskId, setSelectedTask } = useStore();

  const renderView = () => {
    if (activeView === 'inbox')    return <InboxView />;
    if (activeView === 'today')    return <TodayView />;
    if (activeView === 'upcoming') return <UpcomingView />;
    if (activeView === 'kanban')   return <KanbanGlobal />;
    if (activeView === 'calendar') return <CalendarView />;
    if (activeView === 'focus')    return <FocusMode />;

    if (typeof activeView === 'object') {
      if (activeView.type === 'project') {
        const project = projects.find((p) => p.id === activeView.id);
        if (project) return <ProjectView project={project} />;
      }
      if (activeView.type === 'label')  return <LabelView labelId={activeView.id} />;
      if (activeView.type === 'filter') return <FilterView filterId={activeView.id} />;
    }

    return <KanbanGlobal />;
  };

  return (
    <div className="flex flex-1 overflow-hidden bg-[var(--c-bg)] flex-col">
      {/* Mobile top bar */}
      <MobileHeader onSearchOpen={onSearchOpen} />

      {/* Content + desktop sidebar TaskDetail */}
      <div className="flex flex-1 overflow-hidden">
        <main className="flex-1 overflow-y-auto flex flex-col min-w-0">
          {renderView()}
        </main>

        {/* Desktop TaskDetail — side panel */}
        {selectedTaskId && (
          <div className="hidden md:flex">
            <TaskDetail />
          </div>
        )}
      </div>

      {/* Mobile bottom nav */}
      <MobileNav />

      {/* Mobile TaskDetail — full-screen overlay */}
      {selectedTaskId && (
        <div className="md:hidden fixed inset-0 z-50 bg-[var(--c-bg)] flex flex-col">
          {/* Overlay header */}
          <div className="flex items-center gap-3 px-4 py-3 border-b border-[var(--c-border)] bg-[var(--c-sidebar)] shrink-0">
            <button
              onClick={() => setSelectedTask(null)}
              className="p-1.5 rounded-lg text-[var(--c-text2)] hover:bg-[var(--c-hover)]"
            >
              ← Voltar
            </button>
            <span className="text-sm font-semibold text-[var(--c-text1)]">Detalhes</span>
          </div>
          <div className="flex-1 overflow-y-auto">
            <TaskDetail mobileOverlay />
          </div>
        </div>
      )}
    </div>
  );
}
