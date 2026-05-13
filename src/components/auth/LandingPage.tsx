import { useState } from 'react';
import {
  LayoutGrid, Loader2, Eye, EyeOff, X,
  Kanban, Brain, FileText, BookOpen, Target, Bell,
  Check, Star, Zap, Shield, ArrowRight, Sparkles,
  Users, ChevronDown,
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
    setError(null);
    setSuccess(null);
    setLoading(true);
    try {
      if (mode === 'login') {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      } else {
        const { error } = await supabase.auth.signUp({
          email, password,
          options: { data: { full_name: name } },
        });
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
      onClick={onClose}>
      <div className="w-full max-w-md bg-[#0f0f1a] border border-white/10 rounded-2xl shadow-2xl overflow-hidden"
        onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div className="relative px-8 pt-8 pb-6 border-b border-white/10">
          <button onClick={onClose}
            className="absolute top-4 right-4 p-1.5 rounded-lg text-white/40 hover:text-white hover:bg-white/10 transition-all">
            <X size={18} />
          </button>
          <div className="flex items-center gap-3 mb-1">
            <div className="w-9 h-9 bg-indigo-600 rounded-xl flex items-center justify-center">
              <LayoutGrid size={18} className="text-white" />
            </div>
            <span className="text-lg font-bold text-white">TaskNexus</span>
          </div>
          <p className="text-white/50 text-sm">
            {mode === 'signup' ? 'Crie sua conta gratuita' : 'Bem-vindo de volta'}
          </p>
        </div>

        {/* Tabs */}
        <div className="px-8 pt-6">
          <div className="flex bg-white/5 rounded-xl p-1 mb-6">
            {(['login', 'signup'] as const).map(m => (
              <button key={m} onClick={() => { setMode(m); setError(null); setSuccess(null); }}
                className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all
                  ${mode === m ? 'bg-indigo-600 text-white shadow-sm' : 'text-white/40 hover:text-white/70'}`}>
                {m === 'login' ? 'Entrar' : 'Criar Conta'}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="space-y-4 pb-8">
            {mode === 'signup' && (
              <div>
                <label className="block text-xs font-medium text-white/50 mb-1.5">Nome</label>
                <input type="text" value={name} onChange={e => setName(e.target.value)}
                  placeholder="Seu nome" required={mode === 'signup'}
                  className="w-full px-4 py-3 rounded-xl border border-white/10 bg-white/5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 placeholder-white/20" />
              </div>
            )}

            <div>
              <label className="block text-xs font-medium text-white/50 mb-1.5">E-mail</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                placeholder="seu@email.com" required
                className="w-full px-4 py-3 rounded-xl border border-white/10 bg-white/5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 placeholder-white/20" />
            </div>

            <div>
              <label className="block text-xs font-medium text-white/50 mb-1.5">Senha</label>
              <div className="relative">
                <input type={showPassword ? 'text' : 'password'} value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••" required minLength={6}
                  className="w-full px-4 py-3 pr-11 rounded-xl border border-white/10 bg-white/5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 placeholder-white/20" />
                <button type="button" onClick={() => setShowPassword(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60">
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {error && (
              <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-sm text-red-400">
                ⚠️ {error}
              </div>
            )}
            {success && (
              <div className="flex items-center gap-2 p-3 bg-green-500/10 border border-green-500/20 rounded-xl text-sm text-green-400">
                ✅ {success}
              </div>
            )}

            <button type="submit" disabled={loading}
              className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-semibold text-sm disabled:opacity-60 transition-all flex items-center justify-center gap-2 shadow-lg shadow-indigo-500/20 mt-2">
              {loading && <Loader2 size={16} className="animate-spin" />}
              {loading ? 'Aguarde...' : mode === 'login' ? 'Entrar' : 'Criar conta grátis'}
            </button>

            {mode === 'login' && (
              <button type="button"
                onClick={async () => {
                  const e = prompt('Digite seu e-mail:');
                  if (!e) return;
                  await supabase.auth.resetPasswordForEmail(e);
                  alert('E-mail de recuperação enviado!');
                }}
                className="w-full text-center text-xs text-white/30 hover:text-indigo-400 transition-colors pt-1">
                Esqueci minha senha
              </button>
            )}

            {mode === 'signup' && (
              <p className="text-center text-xs text-white/20 pt-1">
                Ao criar conta você concorda com nossos termos de uso. Gratuito para sempre no plano Free.
              </p>
            )}
          </form>
        </div>
      </div>
    </div>
  );
}

// ── Feature Card ──────────────────────────────────────────────────────────────
function FeatureCard({ icon, title, desc, color }: { icon: React.ReactNode; title: string; desc: string; color: string }) {
  return (
    <div className="group p-6 rounded-2xl border border-white/8 bg-white/3 hover:bg-white/6 hover:border-white/15 transition-all duration-300">
      <div className={`w-11 h-11 rounded-xl flex items-center justify-center mb-4 ${color}`}>
        {icon}
      </div>
      <h3 className="text-white font-semibold mb-2">{title}</h3>
      <p className="text-white/50 text-sm leading-relaxed">{desc}</p>
    </div>
  );
}

// ── Pricing Card ─────────────────────────────────────────────────────────────
function PricingCard({
  plan, price, period, features, cta, highlight, onCta,
}: {
  plan: string; price: string; period: string;
  features: string[]; cta: string; highlight: boolean;
  onCta: () => void;
}) {
  return (
    <div className={`relative p-8 rounded-2xl border transition-all duration-300
      ${highlight
        ? 'border-indigo-500/50 bg-indigo-600/10 shadow-2xl shadow-indigo-500/10'
        : 'border-white/10 bg-white/3 hover:border-white/20'}`}>
      {highlight && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
          <span className="px-3 py-1 bg-indigo-600 text-white text-xs font-bold rounded-full flex items-center gap-1">
            <Sparkles size={10} /> MAIS POPULAR
          </span>
        </div>
      )}
      <p className={`text-sm font-semibold mb-4 ${highlight ? 'text-indigo-400' : 'text-white/50'}`}>{plan}</p>
      <div className="flex items-end gap-1 mb-1">
        <span className="text-4xl font-black text-white">{price}</span>
        {price !== 'Grátis' && <span className="text-white/40 text-sm mb-1">/mês</span>}
      </div>
      <p className="text-white/30 text-xs mb-6">{period}</p>

      <ul className="space-y-3 mb-8">
        {features.map(f => (
          <li key={f} className="flex items-start gap-2.5 text-sm text-white/70">
            <Check size={14} className={`mt-0.5 shrink-0 ${highlight ? 'text-indigo-400' : 'text-green-400'}`} />
            {f}
          </li>
        ))}
      </ul>

      <button onClick={onCta}
        className={`w-full py-3 rounded-xl font-semibold text-sm transition-all
          ${highlight
            ? 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-500/20'
            : 'border border-white/20 hover:border-white/40 text-white hover:bg-white/5'}`}>
        {cta}
      </button>
    </div>
  );
}

// ── Stats ─────────────────────────────────────────────────────────────────────
const STATS = [
  { value: '10+', label: 'Funcionalidades' },
  { value: 'IA', label: 'Integrada (Gemini)' },
  { value: '100%', label: 'Seus dados protegidos' },
  { value: 'PWA', label: 'Funciona offline' },
];

// ── FAQ ───────────────────────────────────────────────────────────────────────
function FAQ({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-b border-white/8">
      <button onClick={() => setOpen(v => !v)}
        className="w-full flex items-center justify-between py-5 text-left gap-4">
        <span className="text-white/80 font-medium text-sm">{q}</span>
        <ChevronDown size={16} className={`text-white/30 shrink-0 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && <p className="text-white/40 text-sm pb-5 leading-relaxed">{a}</p>}
    </div>
  );
}

// ── Landing Page ──────────────────────────────────────────────────────────────
export function LandingPage() {
  const [modal, setModal] = useState<'login' | 'signup' | null>(null);

  const openSignup = () => setModal('signup');
  const openLogin  = () => setModal('login');

  return (
    <div className="min-h-screen bg-[#070711] text-white overflow-x-hidden">

      {/* ── Navbar ── */}
      <nav className="fixed top-0 left-0 right-0 z-40 flex items-center justify-between px-6 md:px-12 py-4 border-b border-white/5 bg-[#070711]/80 backdrop-blur-md">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
            <LayoutGrid size={16} className="text-white" />
          </div>
          <span className="font-bold text-white">TaskNexus</span>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={openLogin}
            className="text-sm text-white/60 hover:text-white transition-colors hidden sm:block">
            Entrar
          </button>
          <button onClick={openSignup}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold rounded-xl transition-all shadow-lg shadow-indigo-500/20">
            Começar grátis
          </button>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section className="relative pt-36 pb-24 px-6 text-center overflow-hidden">
        {/* Background glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-indigo-600/15 blur-[120px] rounded-full pointer-events-none" />
        <div className="absolute top-20 left-1/4 w-64 h-64 bg-purple-600/10 blur-[80px] rounded-full pointer-events-none" />

        <div className="relative max-w-4xl mx-auto">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-indigo-500/30 bg-indigo-500/10 text-indigo-300 text-xs font-medium mb-6">
            <Sparkles size={12} /> Gerencie projetos com IA integrada
          </div>

          <h1 className="text-4xl md:text-6xl font-black leading-tight mb-6 tracking-tight">
            Seu time no{' '}
            <span className="bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
              próximo nível
            </span>
            <br />com IA e Kanban
          </h1>

          <p className="text-lg md:text-xl text-white/50 max-w-2xl mx-auto mb-10 leading-relaxed">
            TaskNexus reúne Kanban, atas de reunião com IA, notas, modo foco e muito mais.
            Tudo em um só lugar, protegido e acessível de qualquer dispositivo.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <button onClick={openSignup}
              className="flex items-center gap-2 px-8 py-4 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-2xl transition-all shadow-2xl shadow-indigo-500/25 hover:shadow-indigo-500/40 hover:scale-105 text-base">
              Criar conta grátis <ArrowRight size={18} />
            </button>
            <button onClick={openLogin}
              className="flex items-center gap-2 px-8 py-4 border border-white/15 hover:border-white/30 text-white/70 hover:text-white font-semibold rounded-2xl transition-all text-base">
              Já tenho conta
            </button>
          </div>

          <p className="text-white/25 text-xs mt-5">Sem cartão de crédito. Gratuito para sempre no plano Free.</p>
        </div>

        {/* Stats bar */}
        <div className="relative mt-20 max-w-3xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-px bg-white/8 rounded-2xl overflow-hidden border border-white/8">
          {STATS.map(s => (
            <div key={s.label} className="bg-[#070711] py-6 px-4 text-center">
              <p className="text-2xl font-black text-white">{s.value}</p>
              <p className="text-xs text-white/40 mt-1">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Features ── */}
      <section className="py-24 px-6 max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <p className="text-indigo-400 text-sm font-semibold mb-3 uppercase tracking-wider">Funcionalidades</p>
          <h2 className="text-3xl md:text-4xl font-black mb-4">Tudo que você precisa para produzir mais</h2>
          <p className="text-white/40 max-w-xl mx-auto">Uma plataforma completa para gerenciar projetos, reuniões e conhecimento da sua equipe.</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <FeatureCard icon={<Kanban size={20} className="text-white" />} color="bg-indigo-600"
            title="Kanban Inteligente"
            desc="Organize tarefas em colunas personalizáveis. Arraste, reordene e acompanhe o progresso em tempo real com filtros por projeto." />
          <FeatureCard icon={<Brain size={20} className="text-white" />} color="bg-purple-600"
            title="Assistente com IA (Nex)"
            desc='Descreva o que precisa fazer em linguagem natural. O assistente Nex cria os cards automaticamente usando Gemini 2.5.' />
          <FeatureCard icon={<FileText size={20} className="text-white" />} color="bg-blue-600"
            title="Atas de Reunião com IA"
            desc="Grave ou cole transcrições e a IA gera a ata completa com participantes, decisões e itens de ação prontos para o Kanban." />
          <FeatureCard icon={<BookOpen size={20} className="text-white" />} color="bg-teal-600"
            title="Central de Notas"
            desc="Centralize links importantes, documentos, descrições de projetos e arquivos. Organize por tags, emoji e cores." />
          <FeatureCard icon={<Target size={20} className="text-white" />} color="bg-orange-600"
            title="Modo Foco + Pomodoro"
            desc="Entre no modo foco e use o timer Pomodoro para eliminar distrações e registrar o tempo trabalhado em cada tarefa." />
          <FeatureCard icon={<Bell size={20} className="text-white" />} color="bg-pink-600"
            title="Notificações & Recorrência"
            desc="Receba alertas de tarefas próximas do vencimento. Configure tarefas recorrentes e o próximo card é criado automaticamente." />
        </div>
      </section>

      {/* ── Social Proof ── */}
      <section className="py-16 px-6 border-y border-white/5 bg-white/2">
        <div className="max-w-5xl mx-auto">
          <p className="text-center text-white/30 text-sm mb-10">Usado por equipes que valorizam organização e produtividade</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { name: 'Ana Lima', role: 'Product Manager', text: 'As atas com IA mudaram como conduzimos nossas reuniões. O que levava 30 min agora leva 2.', stars: 5 },
              { name: 'Carlos Melo', role: 'Dev Lead', text: 'O Kanban com cores de projeto e o modo compacto são exatamente o que precisávamos para o nosso fluxo.', stars: 5 },
              { name: 'Júlia Santos', role: 'Freelancer', text: 'O assistente Nex é surpreendente. Eu descrevo meu projeto e ele cria toda a estrutura de tarefas instantaneamente.', stars: 5 },
            ].map(t => (
              <div key={t.name} className="p-6 rounded-2xl border border-white/8 bg-white/3">
                <div className="flex gap-0.5 mb-3">
                  {Array(t.stars).fill(0).map((_, i) => <Star key={i} size={13} className="text-yellow-400 fill-yellow-400" />)}
                </div>
                <p className="text-white/70 text-sm leading-relaxed mb-4">"{t.text}"</p>
                <div>
                  <p className="text-white font-semibold text-sm">{t.name}</p>
                  <p className="text-white/30 text-xs">{t.role}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Pricing ── */}
      <section className="py-24 px-6 max-w-5xl mx-auto">
        <div className="text-center mb-16">
          <p className="text-indigo-400 text-sm font-semibold mb-3 uppercase tracking-wider">Planos</p>
          <h2 className="text-3xl md:text-4xl font-black mb-4">Simples e transparente</h2>
          <p className="text-white/40">Comece grátis, evolua quando precisar.</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
          <PricingCard
            plan="Free" price="Grátis" period="Para sempre"
            highlight={false} cta="Começar grátis" onCta={openSignup}
            features={[
              'Kanban ilimitado',
              'Até 3 projetos',
              'Atas de reunião (3/mês)',
              'Central de Notas (10 notas)',
              'Assistente IA (10 msgs/dia)',
              'PWA — instale no celular',
            ]} />
          <PricingCard
            plan="Pro" price="R$29" period="por usuário/mês"
            highlight={true} cta="Começar Pro" onCta={openSignup}
            features={[
              'Tudo do Free',
              'Projetos ilimitados',
              'Atas ilimitadas + upload de arquivos',
              'Notas ilimitadas',
              'IA ilimitada (Nex)',
              'Modo Foco + Pomodoro avançado',
              'Prioridade no suporte',
            ]} />
          <PricingCard
            plan="Business" price="R$79" period="até 10 usuários/mês"
            highlight={false} cta="Falar com vendas" onCta={() => window.open('mailto:joao.silvestrim@gmail.com?subject=TaskNexus Business')}
            features={[
              'Tudo do Pro',
              'Multi-usuário (até 10)',
              'Dashboard de equipe',
              'Relatórios avançados',
              'Onboarding dedicado',
              'SLA de suporte',
            ]} />
        </div>
      </section>

      {/* ── Why TaskNexus ── */}
      <section className="py-20 px-6 border-t border-white/5 bg-gradient-to-b from-indigo-600/5 to-transparent">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-black mb-12">Por que escolher o TaskNexus?</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
            {[
              { icon: <Shield size={24} className="text-indigo-400" />, title: 'Seus dados, sua privacidade', desc: 'Row Level Security no banco. Nenhum outro usuário acessa seus dados, jamais.' },
              { icon: <Zap size={24} className="text-yellow-400" />, title: 'Rápido como o pensamento', desc: 'Interface otimista: nenhuma ação espera o servidor. Tudo acontece em tempo real.' },
              { icon: <Users size={24} className="text-green-400" />, title: 'Feito para equipes reais', desc: 'Atas de reunião, kanban por projeto e notas compartilhadas. Produtividade coletiva.' },
            ].map(item => (
              <div key={item.title} className="flex flex-col items-center text-center">
                <div className="w-14 h-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mb-4">
                  {item.icon}
                </div>
                <h3 className="font-bold text-white mb-2">{item.title}</h3>
                <p className="text-white/40 text-sm leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section className="py-20 px-6 max-w-2xl mx-auto">
        <h2 className="text-2xl font-black text-center mb-10">Dúvidas frequentes</h2>
        <FAQ q="Preciso de cartão de crédito para o plano Free?"
             a="Não. O plano Free é gratuito para sempre sem necessidade de cartão de crédito. Basta criar sua conta com e-mail e senha." />
        <FAQ q="Posso migrar do Free para o Pro a qualquer momento?"
             a="Sim. Você pode fazer upgrade a qualquer momento e seus dados são totalmente preservados na migração." />
        <FAQ q="Meus dados ficam seguros?"
             a="Sim. Utilizamos Row Level Security (RLS) no Supabase, o que garante que cada usuário só acessa os próprios dados. Nenhuma informação é compartilhada entre contas." />
        <FAQ q="O TaskNexus funciona no celular?"
             a="Sim! O TaskNexus é um PWA (Progressive Web App). Você pode instalar direto pelo Chrome no Android ou pelo Safari no iPhone, sem precisar de nenhuma loja de aplicativos." />
        <FAQ q="A IA consome créditos adicionais?"
             a="No plano Free há limite de 10 mensagens por dia com o assistente Nex. No Pro e Business, o uso de IA é ilimitado." />
      </section>

      {/* ── CTA Final ── */}
      <section className="py-24 px-6 text-center relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-indigo-600/10 to-transparent pointer-events-none" />
        <div className="relative max-w-2xl mx-auto">
          <h2 className="text-3xl md:text-5xl font-black mb-4">
            Pronto para{' '}
            <span className="bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
              produzir mais?
            </span>
          </h2>
          <p className="text-white/40 mb-10 text-lg">Crie sua conta em menos de 1 minuto. Grátis, sem cartão.</p>
          <button onClick={openSignup}
            className="inline-flex items-center gap-3 px-10 py-5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-2xl transition-all shadow-2xl shadow-indigo-500/30 hover:scale-105 text-lg">
            Começar agora — é grátis <ArrowRight size={20} />
          </button>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="border-t border-white/5 py-8 px-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-white/20 text-xs max-w-6xl mx-auto">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 bg-indigo-600 rounded-lg flex items-center justify-center">
            <LayoutGrid size={12} className="text-white" />
          </div>
          <span>TaskNexus © {new Date().getFullYear()}</span>
        </div>
        <div className="flex gap-6">
          <button onClick={openLogin} className="hover:text-white/50 transition-colors">Entrar</button>
          <button onClick={openSignup} className="hover:text-white/50 transition-colors">Criar conta</button>
          <a href="mailto:joao.silvestrim@gmail.com" className="hover:text-white/50 transition-colors">Contato</a>
        </div>
      </footer>

      {/* Auth Modal */}
      {modal && <AuthModal defaultMode={modal} onClose={() => setModal(null)} />}
    </div>
  );
}
