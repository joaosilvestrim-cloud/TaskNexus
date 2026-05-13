import { useState, useRef, useEffect } from 'react';
import {
  LogOut, Settings, User, Moon, Sun, Bell, Keyboard,
  Shield, ChevronRight, X, Check, Palette,
  Download, Trash2,
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useStore } from '../../store/useStore';

// ── Settings Modal ────────────────────────────────────────────────────────────
function SettingsModal({ onClose, userEmail }: { onClose: () => void; userEmail: string }) {
  const { theme, toggleTheme } = useStore();
  const [tab, setTab] = useState<'perfil' | 'aparencia' | 'atalhos' | 'dados'>('perfil');
  const [newPassword, setNewPassword] = useState('');
  const [pwMsg, setPwMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);
  const [pwLoading, setPwLoading] = useState(false);

  const changePassword = async () => {
    if (newPassword.length < 6) { setPwMsg({ type: 'err', text: 'Mínimo 6 caracteres.' }); return; }
    setPwLoading(true);
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    setPwLoading(false);
    if (error) setPwMsg({ type: 'err', text: error.message });
    else { setPwMsg({ type: 'ok', text: 'Senha alterada com sucesso!' }); setNewPassword(''); }
  };

  const exportData = () => {
    const store = useStore.getState();
    const data = {
      tasks: store.tasks,
      projects: store.projects,
      labels: store.labels,
      meetingNotes: store.meetingNotes,
      knowledgeNotes: store.knowledgeNotes,
      exportedAt: new Date().toISOString(),
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `tasknexus-backup-${new Date().toISOString().split('T')[0]}.json`;
    a.click(); URL.revokeObjectURL(url);
  };

  const TABS = [
    { id: 'perfil',    label: 'Perfil',      icon: <User size={14} /> },
    { id: 'aparencia', label: 'Aparência',   icon: <Palette size={14} /> },
    { id: 'atalhos',   label: 'Atalhos',     icon: <Keyboard size={14} /> },
    { id: 'dados',     label: 'Meus Dados',  icon: <Shield size={14} /> },
  ] as const;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      onClick={onClose}>
      <div className="w-full max-w-2xl bg-[var(--c-card)] border border-[var(--c-border)] rounded-2xl shadow-2xl overflow-hidden flex flex-col"
        style={{ maxHeight: '90vh' }}
        onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--c-border)]">
          <div className="flex items-center gap-2.5">
            <Settings size={16} className="text-indigo-400" />
            <h2 className="font-bold text-[var(--c-text1)]">Configurações</h2>
          </div>
          <button onClick={onClose}
            className="p-1.5 rounded-lg text-[var(--c-text3)] hover:bg-[var(--c-hover)] hover:text-[var(--c-text1)] transition-all">
            <X size={16} />
          </button>
        </div>

        <div className="flex flex-1 overflow-hidden">
          {/* Sidebar tabs */}
          <div className="w-44 shrink-0 border-r border-[var(--c-border)] p-3 space-y-0.5">
            {TABS.map(t => (
              <button key={t.id} onClick={() => setTab(t.id)}
                className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm transition-all
                  ${tab === t.id
                    ? 'bg-indigo-600/15 text-indigo-400 font-medium'
                    : 'text-[var(--c-text3)] hover:bg-[var(--c-hover)] hover:text-[var(--c-text2)]'}`}>
                {t.icon} {t.label}
              </button>
            ))}
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">

            {/* ── Perfil ── */}
            {tab === 'perfil' && (
              <>
                <div>
                  <h3 className="text-sm font-semibold text-[var(--c-text1)] mb-4">Informações da conta</h3>
                  <div className="flex items-center gap-4 p-4 rounded-xl bg-[var(--c-elevated)] border border-[var(--c-border)]">
                    <div className="w-14 h-14 rounded-2xl bg-indigo-600 flex items-center justify-center text-white text-xl font-bold shrink-0">
                      {userEmail.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="font-semibold text-[var(--c-text1)]">{userEmail.split('@')[0]}</p>
                      <p className="text-sm text-[var(--c-text3)]">{userEmail}</p>
                      <span className="inline-flex items-center gap-1 mt-1 text-xs bg-indigo-600/20 text-indigo-400 px-2 py-0.5 rounded-full">
                        <Check size={10} /> Plano Free
                      </span>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-semibold text-[var(--c-text1)] mb-3">Alterar senha</h3>
                  <div className="space-y-3">
                    <input type="password" value={newPassword}
                      onChange={e => setNewPassword(e.target.value)}
                      placeholder="Nova senha (mín. 6 caracteres)"
                      className="w-full px-4 py-2.5 rounded-xl border border-[var(--c-border2)] bg-[var(--c-elevated)] text-[var(--c-text1)] text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 placeholder-[var(--c-text3)]" />
                    {pwMsg && (
                      <p className={`text-xs ${pwMsg.type === 'ok' ? 'text-green-400' : 'text-red-400'}`}>
                        {pwMsg.type === 'ok' ? '✅' : '⚠️'} {pwMsg.text}
                      </p>
                    )}
                    <button onClick={changePassword} disabled={pwLoading || !newPassword}
                      className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-sm font-semibold rounded-xl transition-all">
                      {pwLoading ? 'Salvando...' : 'Salvar senha'}
                    </button>
                  </div>
                </div>
              </>
            )}

            {/* ── Aparência ── */}
            {tab === 'aparencia' && (
              <>
                <div>
                  <h3 className="text-sm font-semibold text-[var(--c-text1)] mb-4">Tema</h3>
                  <div className="grid grid-cols-2 gap-3">
                    {(['dark', 'light'] as const).map(t => (
                      <button key={t} onClick={() => { if (theme !== t) toggleTheme(); }}
                        className={`flex items-center gap-3 p-4 rounded-xl border transition-all
                          ${theme === t
                            ? 'border-indigo-500 bg-indigo-600/10'
                            : 'border-[var(--c-border)] hover:border-[var(--c-border2)] bg-[var(--c-elevated)]'}`}>
                        {t === 'dark'
                          ? <Moon size={18} className="text-indigo-400" />
                          : <Sun size={18} className="text-yellow-400" />}
                        <div className="text-left">
                          <p className="text-sm font-medium text-[var(--c-text1)]">{t === 'dark' ? 'Escuro' : 'Claro'}</p>
                          <p className="text-xs text-[var(--c-text3)]">{t === 'dark' ? 'Menos cansativo' : 'Mais luminoso'}</p>
                        </div>
                        {theme === t && <Check size={14} className="ml-auto text-indigo-400" />}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-semibold text-[var(--c-text1)] mb-1">Notificações</h3>
                  <p className="text-xs text-[var(--c-text3)] mb-4">Alertas de tarefas vencendo</p>
                  {[
                    { label: 'Notificações push no navegador', desc: 'Alertas quando tarefas vencem', key: 'push' },
                    { label: 'Som de conclusão', desc: 'Toque ao marcar tarefa como concluída', key: 'sound' },
                  ].map(item => (
                    <div key={item.key} className="flex items-center justify-between py-3 border-b border-[var(--c-border)]">
                      <div>
                        <p className="text-sm text-[var(--c-text1)]">{item.label}</p>
                        <p className="text-xs text-[var(--c-text3)]">{item.desc}</p>
                      </div>
                      <button
                        onClick={() => {
                          if (item.key === 'push' && Notification.permission === 'default') {
                            Notification.requestPermission();
                          }
                        }}
                        className="w-10 h-5 rounded-full bg-indigo-600 flex items-center justify-end px-0.5 transition-all">
                        <div className="w-4 h-4 rounded-full bg-white shadow" />
                      </button>
                    </div>
                  ))}
                </div>
              </>
            )}

            {/* ── Atalhos ── */}
            {tab === 'atalhos' && (
              <div>
                <h3 className="text-sm font-semibold text-[var(--c-text1)] mb-4">Atalhos de teclado</h3>
                <div className="space-y-1">
                  {[
                    { keys: ['Ctrl', 'K'],  desc: 'Busca global' },
                    { keys: ['Ctrl', 'N'],  desc: 'Nova tarefa rápida' },
                    { keys: ['Ctrl', 'B'],  desc: 'Abrir/fechar sidebar' },
                    { keys: ['Esc'],        desc: 'Fechar modal' },
                    { keys: ['F'],          desc: 'Ativar modo foco' },
                    { keys: ['1'],          desc: 'Ir para Inbox' },
                    { keys: ['2'],          desc: 'Ir para Hoje' },
                    { keys: ['3'],          desc: 'Ir para Kanban' },
                  ].map(s => (
                    <div key={s.desc} className="flex items-center justify-between py-3 border-b border-[var(--c-border)]">
                      <span className="text-sm text-[var(--c-text2)]">{s.desc}</span>
                      <div className="flex gap-1">
                        {s.keys.map(k => (
                          <kbd key={k} className="px-2 py-0.5 text-xs rounded-lg border border-[var(--c-border2)] bg-[var(--c-elevated)] text-[var(--c-text2)] font-mono">
                            {k}
                          </kbd>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ── Dados ── */}
            {tab === 'dados' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-sm font-semibold text-[var(--c-text1)] mb-1">Exportar dados</h3>
                  <p className="text-xs text-[var(--c-text3)] mb-4">
                    Baixe um backup completo das suas tarefas, projetos, notas e atas em formato JSON.
                  </p>
                  <button onClick={exportData}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-[var(--c-border2)] bg-[var(--c-elevated)] text-[var(--c-text1)] text-sm hover:bg-[var(--c-hover)] transition-all">
                    <Download size={14} className="text-indigo-400" /> Exportar backup (.json)
                  </button>
                </div>

                <div>
                  <h3 className="text-sm font-semibold text-[var(--c-text1)] mb-1">Privacidade</h3>
                  <div className="p-4 rounded-xl bg-[var(--c-elevated)] border border-[var(--c-border)] text-sm text-[var(--c-text2)] space-y-2">
                    <p className="flex items-center gap-2"><Shield size={13} className="text-green-400" /> Seus dados são protegidos com Row Level Security (RLS)</p>
                    <p className="flex items-center gap-2"><Shield size={13} className="text-green-400" /> Nenhum outro usuário acessa suas informações</p>
                    <p className="flex items-center gap-2"><Shield size={13} className="text-green-400" /> Dados armazenados no Supabase (Postgres criptografado)</p>
                  </div>
                </div>

                <div className="pt-2 border-t border-[var(--c-border)]">
                  <h3 className="text-sm font-semibold text-red-400 mb-1">Zona de perigo</h3>
                  <p className="text-xs text-[var(--c-text3)] mb-3">
                    Ao excluir sua conta, todos os dados são permanentemente apagados.
                  </p>
                  <button
                    onClick={() => {
                      if (confirm('⚠️ Tem certeza? Esta ação é irreversível e apagará TODOS os seus dados.')) {
                        alert('Entre em contato com o suporte para exclusão de conta: joao.silvestrim@gmail.com');
                      }
                    }}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-red-500/30 bg-red-500/5 text-red-400 text-sm hover:bg-red-500/10 transition-all">
                    <Trash2 size={14} /> Excluir minha conta
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── User Menu ─────────────────────────────────────────────────────────────────
export function UserMenu({ userEmail }: { userEmail: string }) {
  const { theme, toggleTheme } = useStore();
  const [open, setOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  const initials = userEmail.charAt(0).toUpperCase();
  const username = userEmail.split('@')[0];

  return (
    <>
      <div ref={ref} className="relative">
        {/* Trigger button */}
        <button onClick={() => setOpen(v => !v)}
          className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl hover:bg-[var(--c-hover)] transition-all group">
          {/* Avatar */}
          <div className="w-7 h-7 rounded-lg bg-indigo-600 flex items-center justify-center text-white text-xs font-bold shrink-0">
            {initials}
          </div>
          <div className="flex-1 text-left min-w-0">
            <p className="text-xs font-semibold text-[var(--c-text1)] truncate">{username}</p>
            <p className="text-[10px] text-[var(--c-text3)] truncate">{userEmail}</p>
          </div>
          <ChevronRight size={12} className={`text-[var(--c-text3)] transition-transform ${open ? 'rotate-90' : ''}`} />
        </button>

        {/* Dropdown */}
        {open && (
          <div className="absolute bottom-full left-0 right-0 mb-1 bg-[var(--c-card)] border border-[var(--c-border)] rounded-2xl shadow-2xl overflow-hidden z-50 animate-fade-in">
            {/* User info header */}
            <div className="px-4 py-3 border-b border-[var(--c-border)] flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center text-white font-bold text-sm shrink-0">
                {initials}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-[var(--c-text1)] truncate">{username}</p>
                <p className="text-xs text-[var(--c-text3)] truncate">{userEmail}</p>
              </div>
            </div>

            {/* Menu items */}
            <div className="p-1.5 space-y-0.5">
              <button onClick={() => { setSettingsOpen(true); setOpen(false); }}
                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm text-[var(--c-text2)] hover:bg-[var(--c-hover)] hover:text-[var(--c-text1)] transition-all">
                <Settings size={14} className="text-[var(--c-text3)]" /> Configurações
              </button>

              <button onClick={() => { toggleTheme(); setOpen(false); }}
                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm text-[var(--c-text2)] hover:bg-[var(--c-hover)] hover:text-[var(--c-text1)] transition-all">
                {theme === 'dark'
                  ? <Sun size={14} className="text-yellow-400" />
                  : <Moon size={14} className="text-indigo-400" />}
                {theme === 'dark' ? 'Tema Claro' : 'Tema Escuro'}
              </button>

              <button
                onClick={() => { setOpen(false); if (Notification.permission === 'default') Notification.requestPermission(); }}
                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm text-[var(--c-text2)] hover:bg-[var(--c-hover)] hover:text-[var(--c-text1)] transition-all">
                <Bell size={14} className="text-[var(--c-text3)]" /> Notificações
              </button>

              <div className="border-t border-[var(--c-border)] my-1" />

              <button onClick={handleLogout}
                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm text-red-400 hover:bg-red-500/10 transition-all">
                <LogOut size={14} /> Sair da conta
              </button>
            </div>
          </div>
        )}
      </div>

      {settingsOpen && (
        <SettingsModal userEmail={userEmail} onClose={() => setSettingsOpen(false)} />
      )}
    </>
  );
}
