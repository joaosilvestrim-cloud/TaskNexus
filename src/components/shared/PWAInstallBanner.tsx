import { useEffect, useState } from 'react';
import { Download, X, Smartphone, Share } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

// Global singleton so sidebar and banner share the same prompt
let globalPrompt: BeforeInstallPromptEvent | null = null;
const listeners = new Set<() => void>();
function notifyListeners() { listeners.forEach(fn => fn()); }

window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  globalPrompt = e as BeforeInstallPromptEvent;
  notifyListeners();
});

export function usePWAInstall() {
  const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
  const isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent) && !(window.navigator as unknown as { standalone?: boolean }).standalone;
  const [prompt, setPrompt] = useState<BeforeInstallPromptEvent | null>(globalPrompt);
  const [installed, setInstalled] = useState(isStandalone);

  useEffect(() => {
    const update = () => setPrompt(globalPrompt);
    listeners.add(update);
    window.addEventListener('appinstalled', () => setInstalled(true));
    return () => { listeners.delete(update); };
  }, []);

  const install = async () => {
    if (!prompt) return false;
    await prompt.prompt();
    const { outcome } = await prompt.userChoice;
    if (outcome === 'accepted') { setInstalled(true); globalPrompt = null; }
    return outcome === 'accepted';
  };

  return { canInstall: !!prompt && !installed, isIOS: isIOS && !isStandalone, installed, install };
}

// ── Floating banner (auto-appears when prompt is available) ───────────────────
export function PWAInstallBanner() {
  const { canInstall, isIOS, installed, install } = usePWAInstall();
  const [visible, setVisible]   = useState(false);
  const [showIOS, setShowIOS]   = useState(false);

  useEffect(() => {
    if (localStorage.getItem('pwa_dismissed')) return;
    if (canInstall) setVisible(true);
    if (isIOS) setVisible(true);
  }, [canInstall, isIOS]);

  const dismiss = () => { localStorage.setItem('pwa_dismissed', '1'); setVisible(false); };

  if (!visible || installed) return null;

  return (
    <>
      <div className="fixed bottom-24 left-4 z-40 w-80 rounded-2xl border border-indigo-500/30 bg-[var(--c-card)] shadow-2xl animate-bounce-in overflow-hidden"
        style={{ boxShadow: '0 8px 32px rgba(99,102,241,0.3)' }}>
        <div className="flex items-center gap-3 px-4 py-3">
          <img src="/icons/icon-192.png" alt="TaskNexus" className="w-10 h-10 rounded-xl shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-[var(--c-text1)]">Instalar TaskNexus</p>
            <p className="text-xs text-[var(--c-text3)]">Use como app no seu dispositivo</p>
          </div>
          <button onClick={dismiss} className="p-1 text-[var(--c-text3)] hover:text-[var(--c-text2)]">
            <X size={14} />
          </button>
        </div>

        {isIOS ? (
          <div className="px-4 pb-3 text-xs text-[var(--c-text2)] bg-[var(--c-elevated)] py-2 flex items-center gap-2">
            <Share size={13} className="text-indigo-400 shrink-0" />
            Toque em <strong>Compartilhar</strong> → <strong>"Adicionar à Tela de Início"</strong>
          </div>
        ) : (
          <div className="flex gap-2 px-4 pb-3">
            <button onClick={async () => { const ok = await install(); if (ok) setVisible(false); }}
              className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-xl transition-colors">
              <Download size={13} /> Instalar agora
            </button>
            <button onClick={() => setShowIOS(true)}
              className="px-3 py-2 border border-[var(--c-border)] text-[var(--c-text3)] hover:text-[var(--c-text2)] text-xs rounded-xl transition-colors">
              <Smartphone size={13} />
            </button>
          </div>
        )}
      </div>

      {/* Manual iOS instructions modal */}
      {showIOS && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 pb-8 px-4"
          onClick={() => setShowIOS(false)}>
          <div className="w-full max-w-sm bg-[var(--c-card)] rounded-2xl p-5 space-y-3" onClick={e => e.stopPropagation()}>
            <p className="font-bold text-[var(--c-text1)]">Instalar no celular</p>
            <div className="space-y-2 text-sm text-[var(--c-text2)]">
              <p><strong>Android (Chrome):</strong></p>
              <p>Menu ⋮ → <em>"Adicionar à tela inicial"</em></p>
              <p className="mt-2"><strong>iPhone/iPad (Safari):</strong></p>
              <p>Botão Compartilhar □↑ → <em>"Adicionar à Tela de Início"</em></p>
            </div>
            <button onClick={() => setShowIOS(false)}
              className="w-full py-2 bg-indigo-600 text-white text-sm rounded-xl">Entendi</button>
          </div>
        </div>
      )}
    </>
  );
}
