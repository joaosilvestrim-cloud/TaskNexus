import { Sidebar } from './components/sidebar/Sidebar';
import { MainContent } from './components/shared/MainContent';

export default function App() {
  return (
    <div className="flex h-screen w-screen overflow-hidden bg-gray-50">
      <Sidebar />
      <MainContent />
    </div>
  );
}
