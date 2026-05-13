import { useEffect, useState } from 'react';
import { Download, X } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export function PWAInstallBanner() {
  const [prompt, setPrompt]     = useState<BeforeInstallPromptEvent | null>(null);
  const [visible, setVisible]   = useState(false);
  const [installed, setInstalled] = useState(false);

  useEffect(() => {
    // Already installed or dismissed before
    if (localStorage.getItem('pwa_dismissed') || window.matchMedia('(display-mode: standalone)').matches) return;

    const handler = (e: Event) => {
      e.preventDefault();
      setPrompt(e as BeforeInstallPromptEvent);
      setVisible(true);
    };
    window.addEventListener('beforeinstallprompt', handler);
    window.addEventListener('appinstalled', () => setInstalled(true));
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstall = async () => {
    if (!prompt) return;
    await prompt.prompt();
    const { outcome } = await prompt.userChoice;
    if (outcome === 'accepted') setInstalled(true);
    setVisible(false);
  };

  const handleDismiss = () => {
    localStorage.setItem('pwa_dismissed', '1');
    setVisible(false);
  };

  if (!visible || installed) return null;

  return (
    <div className="fixed bottom-24 left-4 z-40 flex items-center gap-3 px-4 py-3 rounded-2xl border border-indigo-500/30 bg-[var(--c-card)] shadow-2xl max-w-xs animate-bounce-in"
      style={{ boxShadow: '0 8px 32px rgba(99,102,241,0.25)' }}>
      <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center shrink-0">
        <img src="/icons/icon-192.png" alt="TaskNexus" className="w-8 h-8 rounded-lg" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-[var(--c-text1)]">Instalar TaskNexus</p>
        <p className="text-xs text-[var(--c-text3)]">Acesse como app no seu dispositivo</p>
      </div>
      <div className="flex items-center gap-1 shrink-0">
        <button onClick={handleInstall}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium rounded-xl transition-colors">
          <Download size={12} /> Instalar
        </button>
        <button onClick={handleDismiss}
          className="p-1.5 text-[var(--c-text3)] hover:text-[var(--c-text2)] transition-colors">
          <X size={14} />
        </button>
      </div>
    </div>
  );
}
