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

export function MainContent() {
  const { activeView, projects, selectedTaskId } = useStore();

  const renderView = () => {
    if (activeView === 'inbox') return <InboxView />;
    if (activeView === 'today') return <TodayView />;
    if (activeView === 'upcoming') return <UpcomingView />;
    if (activeView === 'kanban') return <KanbanGlobal />;
    if (activeView === 'calendar') return <CalendarView />;
    if (activeView === 'focus') return <FocusMode />;

    if (typeof activeView === 'object') {
      if (activeView.type === 'project') {
        const project = projects.find((p) => p.id === activeView.id);
        if (project) return <ProjectView project={project} />;
      }
      if (activeView.type === 'label') return <LabelView labelId={activeView.id} />;
      if (activeView.type === 'filter') return <FilterView filterId={activeView.id} />;
    }

    return <KanbanGlobal />;
  };

  // FocusMode renders full-screen with its own layout
  if (activeView === 'focus') {
    return (
      <div className="flex flex-1 overflow-hidden bg-[var(--c-bg)]">
        <main className="flex-1 overflow-y-auto flex flex-col">
          <FocusMode />
        </main>
        {selectedTaskId && <TaskDetail />}
      </div>
    );
  }

  return (
    <div className="flex flex-1 overflow-hidden bg-[var(--c-bg)]">
      <main className="flex-1 overflow-y-auto flex flex-col">
        {renderView()}
      </main>
      {selectedTaskId && <TaskDetail />}
    </div>
  );
}
