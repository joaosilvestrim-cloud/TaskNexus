import { useState } from 'react';
import {
  LayoutGrid, Loader2, Eye, EyeOff, X,
  Brain, FileText, BookOpen, Target,
  Check, Star, Zap, Shield, ArrowRight, Sparkles,
  Users, ChevronDown, Kanban, Bell, Palette,
} from 'lucide-react';
import { supabase } from '../../lib/supabase';

// ── Auth Modal ────────────────────────────────────────────────────────────────
function AuthModal({ defaultMode, onClose }: { defaultMode: 'login' | 'signup'; onClose: () => void }) {
  const [mode, setMode] = useState<'login' | 'signup'>(defaultMode);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null); setSuccess(null); setLoading(true);
    try {
      if (mode === 'login') {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      } else {
        const { error } = await supabase.auth.signUp({ email, password, options: { data: { full_name: name } } });
        if (error) throw error;
        setSuccess('Conta criada! Verifique seu e-mail para confirmar.');
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Erro desconhecido';
      if (msg.includes('Invalid login credentials')) setError('E-mail ou senha incorretos.');
      else if (msg.includes('already registered')) setError('Este e-mail já está cadastrado.');
      else setError(msg);
    } finally { setLoading(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm" onClick={onClose}>
      <div className="w-full max-w-md rounded-2xl shadow-2xl overflow-hidden border border-white/10"
        style={{ background: 'linear-gradient(135deg, #0f0f1e 0%, #131325 100%)' }}
        onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div className="relative px-8 pt-8 pb-6 border-b border-white/8">
          <button onClick={onClose}
            className="absolute top-4 right-4 p-1.5 rounded-lg text-white/30 hover:text-white hover:bg-white/10 transition-all">
            <X size={18} />
          </button>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}>
              <LayoutGrid size={18} className="text-white" />
            </div>
            <div>
              <p className="font-bold text-white text-base">TaskNexus</p>
              <p className="text-white/40 text-xs">{mode === 'signup' ? 'Crie sua conta gratuita' : 'Bem-vindo de volta'}</p>
            </div>
          </div>
        </div>

        <div className="px-8 py-6">
          {/* Tabs */}
          <div className="flex bg-white/5 rounded-xl p-1 mb-6">
            {(['login', 'signup'] as const).map(m => (
              <button key={m} onClick={() => { setMode(m); setError(null); setSuccess(null); }}
                className={`flex-1 py-2.5 text-sm font-semibold rounded-lg transition-all
                  ${mode === m ? 'bg-indigo-600 text-white shadow-lg' : 'text-white/40 hover:text-white/70'}`}>
                {m === 'login' ? 'Entrar' : 'Criar Conta'}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'signup' && (
              <div>
                <label className="block text-xs font-medium text-white/40 mb-1.5 uppercase tracking-wide">Nome</label>
                <input type="text" value={name} onChange={e => setName(e.target.value)}
                  placeholder="Seu nome completo" required={mode === 'signup'}
                  className="w-full px-4 py-3 rounded-xl border border-white/10 bg-white/5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 placeholder-white/20 transition-all" />
              </div>
            )}
            <div>
              <label className="block text-xs font-medium text-white/40 mb-1.5 uppercase tracking-wide">E-mail</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                placeholder="seu@email.com" required
                className="w-full px-4 py-3 rounded-xl border border-white/10 bg-white/5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 placeholder-white/20 transition-all" />
            </div>
            <div>
              <label className="block text-xs font-medium text-white/40 mb-1.5 uppercase tracking-wide">Senha</label>
              <div className="relative">
                <input type={showPassword ? 'text' : 'password'} value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="Mínimo 6 caracteres" required minLength={6}
                  className="w-full px-4 py-3 pr-11 rounded-xl border border-white/10 bg-white/5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 placeholder-white/20 transition-all" />
                <button type="button" onClick={() => setShowPassword(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition-colors">
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {error && <div className="flex items-center gap-2 p-3 rounded-xl text-sm text-red-400 bg-red-500/10 border border-red-500/20">⚠️ {error}</div>}
            {success && <div className="flex items-center gap-2 p-3 rounded-xl text-sm text-green-400 bg-green-500/10 border border-green-500/20">✅ {success}</div>}

            <button type="submit" disabled={loading}
              className="w-full py-3.5 rounded-xl font-bold text-sm text-white transition-all flex items-center justify-center gap-2 mt-2 disabled:opacity-60"
              style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', boxShadow: '0 8px 24px rgba(99,102,241,0.35)' }}>
              {loading && <Loader2 size={16} className="animate-spin" />}
              {loading ? 'Aguarde...' : mode === 'login' ? 'Entrar na conta' : 'Criar conta grátis →'}
            </button>

            {mode === 'login' && (
              <button type="button"
                onClick={async () => {
                  const e = prompt('Digite seu e-mail:');
                  if (!e) return;
                  await supabase.auth.resetPasswordForEmail(e);
                  alert('E-mail de recuperação enviado!');
                }}
                className="w-full text-center text-xs text-white/25 hover:text-indigo-400 transition-colors pt-1">
                Esqueci minha senha
              </button>
            )}
            {mode === 'signup' && (
              <p className="text-center text-xs text-white/20 pt-1">
                Grátis para sempre no plano Free. Sem cartão de crédito.
              </p>
            )}
          </form>
        </div>
      </div>
    </div>
  );
}

// ── App Mockup ────────────────────────────────────────────────────────────────
function AppMockup() {
  const cols = [
    { label: 'A fazer', color: '#6366f1', cards: ['Redesign da homepage', 'Integrar Stripe', 'Criar onboarding'] },
    { label: 'Em progresso', color: '#f59e0b', cards: ['API de relatórios', 'Testes E2E'] },
    { label: 'Concluído', color: '#10b981', cards: ['Deploy na Vercel', 'Setup RLS'] },
  ];
  return (
    <div className="relative w-full select-none pointer-events-none"
      style={{ perspective: '1200px' }}>
      <div className="rounded-2xl overflow-hidden border border-white/10 shadow-2xl"
        style={{
          background: '#0d0d1a',
          transform: 'rotateY(-8deg) rotateX(4deg)',
          boxShadow: '0 40px 80px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.05)',
        }}>
        {/* Titlebar */}
        <div className="flex items-center gap-2 px-4 py-3 border-b border-white/8" style={{ background: '#0a0a16' }}>
          <div className="flex gap-1.5">
            <div className="w-3 h-3 rounded-full bg-red-500/80" />
            <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
            <div className="w-3 h-3 rounded-full bg-green-500/80" />
          </div>
          <div className="flex-1 flex items-center justify-center">
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-md bg-white/5 text-white/30 text-xs">
              <LayoutGrid size={10} /> tasknexus.vercel.app
            </div>
          </div>
        </div>

        {/* App layout */}
        <div className="flex h-64">
          {/* Sidebar */}
          <div className="w-36 shrink-0 border-r border-white/8 p-3 space-y-1" style={{ background: '#0c0c1a' }}>
            <div className="flex items-center gap-2 px-2 py-1 mb-3">
              <div className="w-5 h-5 rounded-md bg-indigo-600 flex items-center justify-center">
                <LayoutGrid size={9} className="text-white" />
              </div>
              <span className="text-white text-xs font-bold">TaskNexus</span>
            </div>
            {['Caixa de entrada','Kanban','Hoje','Em breve','Calendário'].map((item, i) => (
              <div key={item} className={`flex items-center gap-2 px-2 py-1.5 rounded-lg text-xs transition-all
                ${i === 1 ? 'bg-indigo-600/20 text-indigo-300' : 'text-white/30'}`}>
                <div className={`w-1.5 h-1.5 rounded-full ${i === 1 ? 'bg-indigo-400' : 'bg-white/20'}`} />
                {item}
              </div>
            ))}
            <div className="pt-2 border-t border-white/8 mt-2">
              <div className="text-white/20 text-[9px] uppercase tracking-wider px-2 mb-1">Projetos</div>
              {['Marketing','Dev','Design'].map((p, i) => (
                <div key={p} className="flex items-center gap-2 px-2 py-1 text-xs text-white/30">
                  <div className={`w-1.5 h-1.5 rounded-full ${['bg-blue-400','bg-purple-400','bg-pink-400'][i]}`} />
                  {p}
                </div>
              ))}
            </div>
          </div>

          {/* Kanban */}
          <div className="flex-1 p-3 overflow-hidden">
            <div className="flex gap-2 h-full">
              {cols.map(col => (
                <div key={col.label} className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 mb-2">
                    <div className="w-2 h-2 rounded-full" style={{ background: col.color }} />
                    <span className="text-white/50 text-[10px] font-semibold">{col.label}</span>
                  </div>
                  <div className="space-y-1.5">
                    {col.cards.map((card, i) => (
                      <div key={card} className="rounded-lg p-2 border border-white/8 text-[10px] text-white/60"
                        style={{ background: `${col.color}12` }}>
                        <div className="flex items-start gap-1.5">
                          <div className="w-1 h-1 rounded-full mt-0.5 shrink-0" style={{ background: col.color }} />
                          <span>{card}</span>
                        </div>
                        {i === 0 && (
                          <div className="flex gap-1 mt-1.5">
                            <div className="px-1.5 py-0.5 rounded text-[9px]" style={{ background: `${col.color}25`, color: col.color }}>P1</div>
                            <div className="px-1.5 py-0.5 rounded text-[9px] bg-white/5 text-white/30">Hoje</div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Floating badges */}
      <div className="absolute -bottom-4 -left-4 px-3 py-2 rounded-xl border border-white/10 shadow-xl text-xs flex items-center gap-2"
        style={{ background: '#1a1a2e' }}>
        <div className="w-6 h-6 rounded-lg bg-green-500/20 flex items-center justify-center">
          <Check size={12} className="text-green-400" />
        </div>
        <div>
          <p className="text-white font-semibold text-[11px]">Tarefa concluída!</p>
          <p className="text-white/30 text-[9px]">Deploy na Vercel ✅</p>
        </div>
      </div>

      <div className="absolute -top-3 -right-3 px-3 py-2 rounded-xl border border-white/10 shadow-xl text-xs flex items-center gap-2"
        style={{ background: '#1a1a2e' }}>
        <div className="w-6 h-6 rounded-lg bg-indigo-500/20 flex items-center justify-center">
          <Brain size={12} className="text-indigo-400" />
        </div>
        <div>
          <p className="text-white font-semibold text-[11px]">Nex criou 3 cards</p>
          <p className="text-white/30 text-[9px]">via IA em 2s</p>
        </div>
      </div>
    </div>
  );
}

// ── Feature Card ──────────────────────────────────────────────────────────────
function FeatureCard({ icon, title, desc, gradient }: { icon: React.ReactNode; title: string; desc: string; gradient: string }) {
  return (
    <div className="group p-6 rounded-2xl border border-white/8 hover:border-white/15 transition-all duration-300 relative overflow-hidden"
      style={{ background: 'rgba(255,255,255,0.02)' }}>
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
        style={{ background: `radial-gradient(circle at 50% 0%, ${gradient}15 0%, transparent 70%)` }} />
      <div className="relative">
        <div className="w-11 h-11 rounded-xl flex items-center justify-center mb-4 border border-white/10"
          style={{ background: `${gradient}20` }}>
          <div style={{ color: gradient }}>{icon}</div>
        </div>
        <h3 className="text-white font-semibold mb-2">{title}</h3>
        <p className="text-white/40 text-sm leading-relaxed">{desc}</p>
      </div>
    </div>
  );
}

// ── FAQ ───────────────────────────────────────────────────────────────────────
function FAQ({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-b border-white/8">
      <button onClick={() => setOpen(v => !v)}
        className="w-full flex items-center justify-between py-5 text-left gap-4">
        <span className="text-white/80 font-medium text-sm">{q}</span>
        <ChevronDown size={16} className={`text-white/30 shrink-0 transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && <p className="text-white/40 text-sm pb-5 leading-relaxed">{a}</p>}
    </div>
  );
}

// ── Main Landing Page ─────────────────────────────────────────────────────────
export function LandingPage() {
  const [modal, setModal] = useState<'login' | 'signup' | null>(null);

  return (
    <div className="min-h-screen text-white overflow-x-hidden" style={{ background: '#070711' }}>

      {/* ── Navbar ── */}
      <nav className="fixed top-0 left-0 right-0 z-40 border-b border-white/5"
        style={{ background: 'rgba(7,7,17,0.85)', backdropFilter: 'blur(20px)' }}>
        <div className="max-w-7xl mx-auto flex items-center justify-between px-6 py-3.5">
          {/* Logo */}
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center shadow-lg"
              style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}>
              <LayoutGrid size={17} className="text-white" />
            </div>
            <span className="font-bold text-white text-lg tracking-tight">TaskNexus</span>
          </div>

          {/* Nav links — desktop */}
          <div className="hidden md:flex items-center gap-8">
            {['Funcionalidades', 'FAQ'].map(l => (
              <a key={l} href={`#${l.toLowerCase()}`}
                className="text-sm text-white/50 hover:text-white transition-colors">{l}</a>
            ))}
          </div>

          {/* CTA */}
          <div className="flex items-center gap-3">
            <button onClick={() => setModal('login')}
              className="text-sm text-white/60 hover:text-white transition-colors hidden sm:block font-medium">
              Entrar
            </button>
            <button onClick={() => setModal('signup')}
              className="flex items-center gap-1.5 px-5 py-2.5 text-white text-sm font-bold rounded-xl transition-all hover:scale-105"
              style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', boxShadow: '0 8px 20px rgba(99,102,241,0.3)' }}>
              Começar grátis <ArrowRight size={14} />
            </button>
          </div>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section className="pt-28 pb-20 px-6">
        <div className="max-w-7xl mx-auto flex flex-col lg:flex-row gap-16 items-center">

          {/* Left: copy — fixed width so mockup always shows */}
          <div className="flex-1 min-w-0 lg:max-w-[520px]">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-indigo-500/30 bg-indigo-500/10 text-indigo-300 text-xs font-semibold mb-6">
              <Sparkles size={11} /> Gerencie projetos com IA integrada
            </div>

            <h1 className="text-4xl lg:text-5xl font-black leading-[1.1] mb-5 tracking-tight">
              Seu time no{' '}
              <span style={{ background: 'linear-gradient(135deg, #6366f1, #a78bfa, #ec4899)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                próximo nível
              </span>
              {' '}com IA e Kanban
            </h1>

            <p className="text-base text-white/50 leading-relaxed mb-7">
              Kanban inteligente, atas com IA, central de notas e modo foco.
              Tudo em um só lugar, seguro e acessível de qualquer dispositivo.
            </p>

            <div className="flex flex-wrap gap-3 mb-6">
              <button onClick={() => setModal('signup')}
                className="flex items-center gap-2 px-7 py-3.5 text-white font-bold rounded-xl text-sm transition-all hover:scale-105"
                style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', boxShadow: '0 10px 28px rgba(99,102,241,0.3)' }}>
                Criar conta grátis <ArrowRight size={16} />
              </button>
              <button onClick={() => setModal('login')}
                className="flex items-center gap-2 px-7 py-3.5 border border-white/15 hover:border-white/30 text-white/70 hover:text-white font-semibold rounded-xl text-sm transition-all">
                Já tenho conta
              </button>
            </div>

            <p className="text-white/20 text-xs mb-6">Sem cartão de crédito · Free para sempre · PWA instalável</p>

            {/* Social proof */}
            <div className="flex items-center gap-3">
              <div className="flex -space-x-2">
                {['6366f1','8b5cf6','ec4899','10b981','f59e0b'].map((c, i) => (
                  <div key={i} className="w-7 h-7 rounded-full border-2 border-[#070711] flex items-center justify-center text-white text-xs font-bold"
                    style={{ background: `#${c}` }}>
                    {String.fromCharCode(65 + i)}
                  </div>
                ))}
              </div>
              <div>
                <div className="flex gap-0.5 mb-0.5">
                  {[1,2,3,4,5].map(i => <Star key={i} size={10} className="text-yellow-400 fill-yellow-400" />)}
                </div>
                <p className="text-white/30 text-xs">Adorado por times de produto</p>
              </div>
            </div>
          </div>

          {/* Right: App mockup — always visible on lg+ */}
          <div className="flex-1 min-w-0 w-full lg:block">
            <AppMockup />
          </div>
        </div>
      </section>

      {/* ── Stats ── */}
      <section className="py-12 border-y border-white/5" style={{ background: 'rgba(255,255,255,0.015)' }}>
        <div className="max-w-5xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8 px-6 text-center">
          {[
            { value: '10+', label: 'Módulos integrados' },
            { value: 'Gemini', label: 'IA de última geração' },
            { value: 'RLS', label: 'Dados isolados por usuário' },
            { value: 'PWA', label: 'Funciona offline' },
          ].map(s => (
            <div key={s.label}>
              <p className="text-3xl font-black text-white mb-1">{s.value}</p>
              <p className="text-white/30 text-sm">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Features ── */}
      <section id="funcionalidades" className="py-24 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-indigo-400 text-xs font-bold mb-3 uppercase tracking-widest">Funcionalidades</p>
            <h2 className="text-3xl md:text-4xl font-black mb-4">Tudo que você precisa para produzir mais</h2>
            <p className="text-white/40 max-w-xl mx-auto text-sm">Uma plataforma completa para gerenciar projetos, reuniões e conhecimento da sua equipe.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <FeatureCard icon={<Kanban size={20} />} gradient="#6366f1"
              title="Kanban Inteligente"
              desc="Organize tarefas em colunas personalizáveis com cores por projeto, modo compacto e filtros avançados." />
            <FeatureCard icon={<Brain size={20} />} gradient="#8b5cf6"
              title="Assistente IA (Nex)"
              desc='Descreva em linguagem natural e o Nex cria os cards automaticamente usando Gemini 2.5 Flash.' />
            <FeatureCard icon={<FileText size={20} />} gradient="#3b82f6"
              title="Atas com IA"
              desc="Cole transcrições e a IA gera ata completa com participantes, decisões e itens de ação prontos para o Kanban." />
            <FeatureCard icon={<BookOpen size={20} />} gradient="#14b8a6"
              title="Central de Notas"
              desc="Centralize links, documentos, descrições e arquivos. Organize por tags, emoji e cores personalizadas." />
            <FeatureCard icon={<Target size={20} />} gradient="#f97316"
              title="Modo Foco + Pomodoro"
              desc="Entre no modo foco com timer Pomodoro integrado para eliminar distrações e registrar tempo por tarefa." />
            <FeatureCard icon={<Bell size={20} />} gradient="#ec4899"
              title="Recorrência & Alertas"
              desc="Configure tarefas recorrentes e receba notificações push quando prazos se aproximarem." />
          </div>
        </div>
      </section>

      {/* ── Testimonials ── */}
      <section className="py-16 px-6 border-y border-white/5" style={{ background: 'rgba(255,255,255,0.015)' }}>
        <div className="max-w-5xl mx-auto">
          <p className="text-center text-white/20 text-sm mb-10 uppercase tracking-wider">O que dizem os usuários</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {[
              { name: 'Ana Lima', role: 'Product Manager', avatar: '6366f1', text: 'As atas com IA mudaram como conduzimos nossas reuniões. O que levava 30 min agora leva 2.' },
              { name: 'Carlos Melo', role: 'Dev Lead', avatar: '8b5cf6', text: 'O Kanban com cores de projeto e o modo compacto são exatamente o que precisávamos.' },
              { name: 'Júlia Santos', role: 'Freelancer', avatar: 'ec4899', text: 'O assistente Nex é surpreendente. Descrevo meu projeto e ele cria toda a estrutura de tarefas.' },
            ].map(t => (
              <div key={t.name} className="p-6 rounded-2xl border border-white/8 transition-all hover:border-white/15"
                style={{ background: 'rgba(255,255,255,0.03)' }}>
                <div className="flex gap-0.5 mb-4">
                  {[1,2,3,4,5].map(i => <Star key={i} size={13} className="text-yellow-400 fill-yellow-400" />)}
                </div>
                <p className="text-white/60 text-sm leading-relaxed mb-5">"{t.text}"</p>
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full flex items-center justify-center text-white text-sm font-bold"
                    style={{ background: `#${t.avatar}` }}>
                    {t.name[0]}
                  </div>
                  <div>
                    <p className="text-white font-semibold text-sm">{t.name}</p>
                    <p className="text-white/30 text-xs">{t.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>


      {/* ── Why section ── */}
      <section className="py-20 px-6 border-t border-white/5" style={{ background: 'rgba(99,102,241,0.04)' }}>
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-black mb-12">Por que escolher o TaskNexus?</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
            {[
              { icon: <Shield size={22} className="text-indigo-400" />, bg: 'rgba(99,102,241,0.15)', title: 'Seus dados, sua privacidade', desc: 'Row Level Security no banco. Nenhum outro usuário acessa seus dados, jamais.' },
              { icon: <Zap size={22} className="text-yellow-400" />, bg: 'rgba(245,158,11,0.15)', title: 'Rápido como o pensamento', desc: 'Interface otimista: nenhuma ação espera o servidor. Tudo acontece instantaneamente.' },
              { icon: <Palette size={22} className="text-pink-400" />, bg: 'rgba(236,72,153,0.15)', title: 'Personalizável ao máximo', desc: 'Cores por projeto, modo compacto, temas claro/escuro e muito mais.' },
            ].map(item => (
              <div key={item.title} className="flex flex-col items-center text-center">
                <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4 border border-white/10"
                  style={{ background: item.bg }}>
                  {item.icon}
                </div>
                <h3 className="font-bold text-white mb-2 text-sm">{item.title}</h3>
                <p className="text-white/35 text-sm leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section id="faq" className="py-20 px-6">
        <div className="max-w-2xl mx-auto">
          <h2 className="text-2xl font-black text-center mb-10">Dúvidas frequentes</h2>
          <FAQ q="Preciso de cartão de crédito para o plano Free?" a="Não. O plano Free é gratuito para sempre sem necessidade de cartão de crédito. Basta criar sua conta com e-mail e senha." />
          <FAQ q="Posso migrar do Free para o Pro a qualquer momento?" a="Sim. Você pode fazer upgrade a qualquer momento e seus dados são totalmente preservados." />
          <FAQ q="Meus dados ficam seguros?" a="Sim. Utilizamos Row Level Security (RLS) no Supabase, garantindo que cada usuário só acessa os próprios dados." />
          <FAQ q="O TaskNexus funciona no celular?" a="Sim! É um PWA instalável direto pelo Chrome (Android) ou Safari (iPhone), sem precisar de loja de aplicativos." />
          <FAQ q="A IA consome créditos adicionais?" a="No Free há limite de 10 mensagens/dia. No Pro e Business o uso de IA é ilimitado." />
        </div>
      </section>

      {/* ── CTA Final ── */}
      <section className="py-24 px-6 text-center relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none"
          style={{ background: 'radial-gradient(ellipse at center, rgba(99,102,241,0.15) 0%, transparent 70%)' }} />
        <div className="relative max-w-2xl mx-auto">
          <h2 className="text-4xl md:text-5xl font-black mb-4">
            Pronto para{' '}
            <span style={{ background: 'linear-gradient(135deg, #6366f1, #a78bfa)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              produzir mais?
            </span>
          </h2>
          <p className="text-white/40 mb-10 text-lg">Crie sua conta em menos de 1 minuto. Grátis, sem cartão.</p>
          <button onClick={() => setModal('signup')}
            className="inline-flex items-center gap-3 px-10 py-5 text-white font-bold rounded-2xl text-lg transition-all hover:scale-105"
            style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', boxShadow: '0 16px 40px rgba(99,102,241,0.35)' }}>
            Começar agora — é grátis <ArrowRight size={20} />
          </button>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="border-t border-white/5 py-8 px-6">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}>
              <LayoutGrid size={13} className="text-white" />
            </div>
            <span className="text-white/40 text-sm font-medium">TaskNexus © {new Date().getFullYear()}</span>
          </div>
          <div className="flex items-center gap-2 text-white/20 text-xs">
            <Users size={11} /> Feito com ❤️ para times produtivos
          </div>
          <div className="flex gap-6 text-xs text-white/25">
            <button onClick={() => setModal('login')} className="hover:text-white/60 transition-colors">Entrar</button>
            <button onClick={() => setModal('signup')} className="hover:text-white/60 transition-colors">Criar conta</button>
            <a href="mailto:joao.silvestrim@gmail.com" className="hover:text-white/60 transition-colors">Contato</a>
          </div>
        </div>
      </footer>

      {modal && <AuthModal defaultMode={modal} onClose={() => setModal(null)} />}
    </div>
  );
}
