import { useState } from 'react';
import { LayoutGrid, Loader2, Eye, EyeOff } from 'lucide-react';
import { supabase } from '../../lib/supabase';

export function AuthScreen() {
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setLoading(true);

    try {
      if (mode === 'login') {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      } else {
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        setSuccess('Conta criada! Verifique seu e-mail para confirmar.');
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Erro desconhecido';
      if (msg.includes('Invalid login credentials')) setError('E-mail ou senha incorretos.');
      else if (msg.includes('already registered')) setError('Este e-mail já está cadastrado.');
      else setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--c-bg)] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-14 h-14 bg-indigo-600 rounded-2xl flex items-center justify-center shadow-lg mb-3">
            <LayoutGrid size={28} className="text-white" />
          </div>
          <h1 className="text-2xl font-bold text-[var(--c-text1)]">TaskNexus</h1>
          <p className="text-sm text-[var(--c-text2)] mt-1">Gerenciamento de tarefas e projetos</p>
        </div>

        {/* Card */}
        <div className="bg-[var(--c-card)] rounded-2xl shadow-xl border border-[var(--c-border)] p-8">
          {/* Tabs */}
          <div className="flex bg-[var(--c-elevated)] rounded-xl p-1 mb-6">
            {(['login', 'signup'] as const).map((m) => (
              <button
                key={m}
                onClick={() => { setMode(m); setError(null); setSuccess(null); }}
                className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all
                  ${mode === m ? 'bg-[var(--c-active)] text-indigo-500 shadow-sm' : 'text-[var(--c-text3)] hover:text-[var(--c-text2)]'}`}
              >
                {m === 'login' ? 'Entrar' : 'Criar Conta'}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-[var(--c-text2)] mb-1">E-mail</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="seu@email.com"
                className="w-full px-4 py-2.5 rounded-xl border border-[var(--c-border2)] bg-[var(--c-elevated)] text-[var(--c-text1)] text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 placeholder-[var(--c-text3)]"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-[var(--c-text2)] mb-1">Senha</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                  placeholder="••••••••"
                  className="w-full px-4 py-2.5 pr-11 rounded-xl border border-[var(--c-border2)] bg-[var(--c-elevated)] text-[var(--c-text1)] text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 placeholder-[var(--c-text3)]"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--c-text3)] hover:text-[var(--c-text2)]"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {error && (
              <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600">
                ⚠️ {error}
              </div>
            )}

            {success && (
              <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-xl text-sm text-green-700">
                ✅ {success}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-indigo-600 text-white rounded-xl font-semibold text-sm hover:bg-indigo-700 disabled:opacity-60 transition-all flex items-center justify-center gap-2 shadow-md hover:shadow-lg"
            >
              {loading && <Loader2 size={16} className="animate-spin" />}
              {loading ? 'Aguarde...' : mode === 'login' ? 'Entrar' : 'Criar Conta'}
            </button>
          </form>

          {mode === 'login' && (
            <button
              onClick={async () => {
                const e = prompt('Digite seu e-mail para recuperar a senha:');
                if (!e) return;
                await supabase.auth.resetPasswordForEmail(e);
                alert('E-mail de recuperação enviado!');
              }}
              className="w-full text-center text-xs text-[var(--c-text3)] hover:text-indigo-600 mt-4 transition-colors"
            >
              Esqueci minha senha
            </button>
          )}
        </div>

        <p className="text-center text-xs text-[var(--c-text3)] mt-6">
          Seus dados são protegidos com Row Level Security no Supabase.
        </p>
      </div>
    </div>
  );
}
