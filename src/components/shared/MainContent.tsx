import { useStore } from '../../store/useStore';
import { InboxView } from '../tasks/InboxView';
import { TodayView } from '../tasks/TodayView';
import { UpcomingView } from '../tasks/UpcomingView';
import { ProjectView } from '../projects/ProjectView';
import { LabelView } from '../tasks/LabelView';
import { FilterView } from '../tasks/FilterView';
import { TaskDetail } from '../tasks/TaskDetail';

export function MainContent() {
  const { activeView, projects, selectedTaskId } = useStore();

  const renderView = () => {
    if (activeView === 'inbox') return <InboxView />;
    if (activeView === 'today') return <TodayView />;
    if (activeView === 'upcoming') return <UpcomingView />;

    if (typeof activeView === 'object') {
      if (activeView.type === 'project') {
        const project = projects.find((p) => p.id === activeView.id);
        if (project) return <ProjectView project={project} />;
      }
      if (activeView.type === 'label') return <LabelView labelId={activeView.id} />;
      if (activeView.type === 'filter') return <FilterView filterId={activeView.id} />;
    }

    return <InboxView />;
  };

  return (
    <div className="flex flex-1 overflow-hidden">
      <main className="flex-1 overflow-y-auto">
        {renderView()}
      </main>
      {selectedTaskId && <TaskDetail />}
    </div>
  );
}
