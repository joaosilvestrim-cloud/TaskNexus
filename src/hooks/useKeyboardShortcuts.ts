import { useEffect } from 'react';
import { useStore } from '../store/useStore';

export function useKeyboardShortcuts(
  onOpenSearch: () => void,
  onOpenQuickAdd: () => void,
) {
  const { setActiveView, setSelectedTask } = useStore();

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      // Skip if typing in an input/textarea/select
      const target = e.target as HTMLElement;
      const isTyping = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.tagName === 'SELECT' || target.isContentEditable;

      // Cmd+K or Ctrl+K → global search (works even in inputs)
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        onOpenSearch();
        return;
      }

      if (isTyping) return;

      switch (e.key) {
        case 'n':
        case 'N':
          e.preventDefault();
          onOpenQuickAdd();
          break;
        case 'k':
        case 'K':
          e.preventDefault();
          setActiveView('kanban');
          break;
        case 't':
        case 'T':
          e.preventDefault();
          setActiveView('today');
          break;
        case 'c':
        case 'C':
          e.preventDefault();
          setActiveView('calendar');
          break;
        case 'f':
        case 'F':
          e.preventDefault();
          setActiveView('focus');
          break;
        case 'Escape':
          setSelectedTask(null);
          break;
      }
    };

    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [setActiveView, setSelectedTask, onOpenSearch, onOpenQuickAdd]);
}
