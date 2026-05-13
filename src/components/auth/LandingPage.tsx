import { useState } from 'react';
import {
  LayoutGrid, Loader2, Eye, EyeOff, X,
  Brain, FileText, BookOpen, Target,
  Check, Star, ArrowRight, Sparkles,
  ChevronDown, Bell, Palette, Kanban,
  Shield, Zap, Users,
} from 'lucide-react';
import { supabase } from '../../lib/supabase';

// ── Auth Modal ────────────────────────────────────────────────────────────────
function AuthModal({ defaultMode, onClose }: { defaultMode: 'login' | 'signup'; onClose: () => void }) {
  const [mode, setMode] = useState<'login' | 'signup'>(defaultMode);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
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
      const msg = err instanceof Error ? err.message : 'Erro';
      if (msg.includes('Invalid login credentials')) setError('E-mail ou senha incorretos.');
      else if (msg.includes('already registered')) setError('Este e-mail já está cadastrado.');
      else setError(msg);
    } finally { setLoading(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm" onClick={onClose}>
      <div className="w-full max-w-md rounded-2xl shadow-2xl overflow-hidden"
        style={{ background: '#0f0f1e', border: '1px solid rgba(255,255,255,0.1)' }}
        onClick={e => e.stopPropagation()}>
        <div className="relative px-8 pt-7 pb-5 border-b border-white/8">
          <button onClick={onClose} className="absolute top-4 right-4 p-1.5 rounded-lg text-white/30 hover:text-white hover:bg-white/10 transition-all">
            <X size={18} />
          </button>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg,#6366f1,#8b5cf6)' }}>
              <LayoutGrid size={16} className="text-white" />
            </div>
            <div>
              <p className="font-bold text-white">TaskNexus</p>
              <p className="text-white/40 text-xs">{mode === 'signup' ? 'Crie sua conta gratuita' : 'Bem-vindo de volta'}</p>
            </div>
          </div>
        </div>
        <div className="px-8 py-6">
          <div className="flex bg-white/5 rounded-xl p-1 mb-5">
            {(['login','signup'] as const).map(m => (
              <button key={m} onClick={() => { setMode(m); setError(null); setSuccess(null); }}
                className={`flex-1 py-2.5 text-sm font-semibold rounded-lg transition-all ${mode===m ? 'bg-indigo-600 text-white' : 'text-white/40 hover:text-white/70'}`}>
                {m === 'login' ? 'Entrar' : 'Criar Conta'}
              </button>
            ))}
          </div>
          <form onSubmit={submit} className="space-y-4">
            {mode === 'signup' && (
              <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="Seu nome" required
                className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white text-sm placeholder-white/20 focus:outline-none focus:ring-2 focus:ring-indigo-500" />
            )}
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="seu@email.com" required
              className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white text-sm placeholder-white/20 focus:outline-none focus:ring-2 focus:ring-indigo-500" />
            <div className="relative">
              <input type={showPass ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)}
                placeholder="Senha (mín. 6 caracteres)" required minLength={6}
                className="w-full px-4 py-3 pr-11 rounded-xl bg-white/5 border border-white/10 text-white text-sm placeholder-white/20 focus:outline-none focus:ring-2 focus:ring-indigo-500" />
              <button type="button" onClick={() => setShowPass(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60">
                {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            {error   && <p className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3">⚠️ {error}</p>}
            {success && <p className="text-sm text-green-400 bg-green-500/10 border border-green-500/20 rounded-xl px-4 py-3">✅ {success}</p>}
            <button type="submit" disabled={loading}
              className="w-full py-3.5 rounded-xl font-bold text-sm text-white flex items-center justify-center gap-2 disabled:opacity-60 transition-all"
              style={{ background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', boxShadow: '0 8px 20px rgba(99,102,241,0.3)' }}>
              {loading && <Loader2 size={16} className="animate-spin" />}
              {loading ? 'Aguarde...' : mode === 'login' ? 'Entrar na conta' : 'Criar conta grátis →'}
            </button>
            {mode === 'login' && (
              <button type="button" onClick={async () => {
                const e = prompt('Digite seu e-mail:');
                if (!e) return;
                await supabase.auth.resetPasswordForEmail(e);
                alert('E-mail de recuperação enviado!');
              }} className="w-full text-center text-xs text-white/25 hover:text-indigo-400 transition-colors pt-1">
                Esqueci minha senha
              </button>
            )}
          </form>
        </div>
      </div>
    </div>
  );
}

// ── Kanban Preview (sem transforms 3D que causam overflow) ───────────────────
function KanbanPreview() {
  const cols = [
    { label: 'A fazer',      dot: '#6366f1', cards: [{ t:'Redesign homepage', tag:'P1' }, { t:'Integrar Stripe', tag:'P2' }, { t:'Criar onboarding', tag:'P3' }] },
    { label: 'Em progresso', dot: '#f59e0b', cards: [{ t:'API de relatórios', tag:'P1' }, { t:'Testes E2E', tag:'P2' }] },
    { label: 'Concluído',    dot: '#10b981', cards: [{ t:'Deploy na Vercel', tag:'✓' }, { t:'Setup RLS', tag:'✓' }] },
  ];
  return (
    <div className="relative w-full max-w-[580px] mx-auto">
      {/* Glow */}
      <div className="absolute -inset-4 rounded-3xl pointer-events-none" style={{ background: 'radial-gradient(ellipse at center, rgba(99,102,241,0.2) 0%, transparent 70%)' }} />

      {/* Window chrome */}
      <div className="relative rounded-2xl overflow-hidden shadow-2xl" style={{ border: '1px solid rgba(255,255,255,0.1)', background: '#0d0d1a' }}>
        {/* Title bar */}
        <div className="flex items-center gap-2 px-4 py-3 border-b border-white/8" style={{ background: '#0a0a16' }}>
          <div className="flex gap-1.5">
            <span className="w-3 h-3 rounded-full bg-red-400/70" />
            <span className="w-3 h-3 rounded-full bg-yellow-400/70" />
            <span className="w-3 h-3 rounded-full bg-green-400/70" />
          </div>
          <div className="flex-1 flex justify-center">
            <span className="flex items-center gap-1.5 text-white/20 text-xs px-3 py-1 rounded-md bg-white/5">
              <LayoutGrid size={9} /> tasknexus.vercel.app
            </span>
          </div>
        </div>

        {/* App */}
        <div className="flex" style={{ height: 220 }}>
          {/* Sidebar */}
          <div className="w-32 shrink-0 p-2 border-r border-white/8" style={{ background: '#0b0b18' }}>
            <div className="flex items-center gap-1.5 px-2 py-1 mb-2">
              <div className="w-4 h-4 rounded bg-indigo-600 flex items-center justify-center"><LayoutGrid size={8} className="text-white" /></div>
              <span className="text-white text-[10px] font-bold">TaskNexus</span>
            </div>
            {['Caixa de entrada','Kanban','Hoje','Em breve'].map((item, i) => (
              <div key={item} className={`flex items-center gap-1.5 px-2 py-1.5 rounded-lg text-[10px] mb-0.5 ${i===1 ? 'bg-indigo-600/25 text-indigo-300' : 'text-white/25'}`}>
                <span className={`w-1 h-1 rounded-full ${i===1 ? 'bg-indigo-400' : 'bg-white/15'}`} />
                {item}
              </div>
            ))}
            <div className="border-t border-white/8 mt-2 pt-2">
              <p className="text-[8px] text-white/15 uppercase tracking-wider px-2 mb-1">Projetos</p>
              {[['#6366f1','Marketing'],['#8b5cf6','Dev'],['#ec4899','Design']].map(([c,n]) => (
                <div key={n} className="flex items-center gap-1.5 px-2 py-1 text-[10px] text-white/20">
                  <span className="w-1.5 h-1.5 rounded-full" style={{ background: c }} />{n}
                </div>
              ))}
            </div>
          </div>

          {/* Kanban board */}
          <div className="flex-1 p-3 overflow-hidden">
            <div className="flex gap-2 h-full">
              {cols.map(col => (
                <div key={col.label} className="flex-1 min-w-0 flex flex-col gap-1.5">
                  <div className="flex items-center gap-1 mb-1">
                    <span className="w-2 h-2 rounded-full" style={{ background: col.dot }} />
                    <span className="text-[9px] font-semibold text-white/40">{col.label}</span>
                  </div>
                  {col.cards.map(card => (
                    <div key={card.t} className="rounded-lg p-2 border border-white/8" style={{ background: `${col.dot}12` }}>
                      <p className="text-[9px] text-white/60 leading-snug mb-1">{card.t}</p>
                      <span className="inline-block text-[8px] px-1.5 py-0.5 rounded font-medium" style={{ background: `${col.dot}30`, color: col.dot }}>
                        {card.tag}
                      </span>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Floating badges */}
      <div className="absolute -bottom-5 left-4 flex items-center gap-2 px-3 py-2 rounded-xl shadow-xl text-xs"
        style={{ background: '#1a1a2e', border: '1px solid rgba(255,255,255,0.1)' }}>
        <div className="w-5 h-5 rounded-lg bg-green-500/20 flex items-center justify-center"><Check size={11} className="text-green-400" /></div>
        <div><p className="text-white font-semibold text-[11px]">Tarefa concluída!</p><p className="text-white/30 text-[9px]">Deploy na Vercel ✅</p></div>
      </div>
      <div className="absolute -top-4 right-4 flex items-center gap-2 px-3 py-2 rounded-xl shadow-xl text-xs"
        style={{ background: '#1a1a2e', border: '1px solid rgba(255,255,255,0.1)' }}>
        <div className="w-5 h-5 rounded-lg bg-indigo-500/20 flex items-center justify-center"><Brain size={11} className="text-indigo-400" /></div>
        <div><p className="text-white font-semibold text-[11px]">Nex criou 3 cards</p><p className="text-white/30 text-[9px]">via IA em 2s</p></div>
      </div>
    </div>
  );
}

// ── Feature Card ──────────────────────────────────────────────────────────────
function Feat({ icon, title, desc, color }: { icon: React.ReactNode; title: string; desc: string; color: string }) {
  return (
    <div className="p-6 rounded-2xl border border-white/8 hover:border-white/15 transition-all" style={{ background: 'rgba(255,255,255,0.025)' }}>
      <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-4 border border-white/10" style={{ background: `${color}20` }}>
        <div style={{ color }}>{icon}</div>
      </div>
      <h3 className="text-white font-semibold text-sm mb-2">{title}</h3>
      <p className="text-white/40 text-sm leading-relaxed">{desc}</p>
    </div>
  );
}

// ── FAQ Item ──────────────────────────────────────────────────────────────────
function FAQ({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-b border-white/8">
      <button onClick={() => setOpen(v => !v)} className="w-full flex items-center justify-between py-4 gap-4 text-left">
        <span className="text-white/75 text-sm font-medium">{q}</span>
        <ChevronDown size={15} className={`text-white/30 shrink-0 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && <p className="text-white/40 text-sm pb-4 leading-relaxed">{a}</p>}
    </div>
  );
}

// ── Landing Page ──────────────────────────────────────────────────────────────
export function LandingPage() {
  const [modal, setModal] = useState<'login' | 'signup' | null>(null);

  return (
    <div className="min-h-screen text-white" style={{ background: '#070711' }}>

      {/* Navbar */}
      <nav className="sticky top-0 z-40 border-b border-white/5" style={{ background: 'rgba(7,7,17,0.9)', backdropFilter: 'blur(16px)' }}>
        <div className="max-w-6xl mx-auto flex items-center justify-between px-5 py-3.5">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg,#6366f1,#8b5cf6)' }}>
              <LayoutGrid size={15} className="text-white" />
            </div>
            <span className="font-bold text-white">TaskNexus</span>
          </div>
          <div className="hidden md:flex items-center gap-7">
            {['Funcionalidades','FAQ'].map(l => (
              <a key={l} href={`#${l.toLowerCase()}`} className="text-sm text-white/50 hover:text-white transition-colors">{l}</a>
            ))}
          </div>
          <div className="flex items-center gap-2.5">
            <button onClick={() => setModal('login')} className="text-sm text-white/50 hover:text-white transition-colors hidden sm:block">Entrar</button>
            <button onClick={() => setModal('signup')}
              className="flex items-center gap-1.5 px-4 py-2 text-white text-sm font-bold rounded-xl transition-all hover:opacity-90"
              style={{ background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', boxShadow: '0 6px 16px rgba(99,102,241,0.3)' }}>
              Começar grátis <ArrowRight size={13} />
            </button>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="px-5 pt-16 pb-24">
        <div className="max-w-6xl mx-auto">
          {/* Two-column on lg+ */}
          <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-16">

            {/* Copy */}
            <div className="flex-1 text-center lg:text-left">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-indigo-500/30 bg-indigo-500/10 text-indigo-300 text-xs font-semibold mb-5">
                <Sparkles size={11} /> Gerencie projetos com IA integrada
              </div>
              <h1 className="text-4xl sm:text-5xl font-black leading-[1.1] tracking-tight mb-5">
                Seu time no{' '}
                <span style={{ background: 'linear-gradient(135deg,#6366f1,#a78bfa,#ec4899)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                  próximo nível
                </span>
                {' '}com IA e Kanban
              </h1>
              <p className="text-base text-white/50 leading-relaxed mb-7 max-w-md mx-auto lg:mx-0">
                Kanban inteligente, atas com IA, central de notas e modo foco. Tudo em um só lugar, seguro e acessível de qualquer dispositivo.
              </p>
              <div className="flex flex-wrap justify-center lg:justify-start gap-3 mb-5">
                <button onClick={() => setModal('signup')}
                  className="flex items-center gap-2 px-7 py-3.5 text-white font-bold rounded-xl text-sm transition-all hover:opacity-90 hover:scale-105"
                  style={{ background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', boxShadow: '0 10px 24px rgba(99,102,241,0.3)' }}>
                  Criar conta grátis <ArrowRight size={15} />
                </button>
                <button onClick={() => setModal('login')}
                  className="flex items-center gap-2 px-7 py-3.5 border border-white/15 hover:border-white/30 text-white/70 hover:text-white font-semibold rounded-xl text-sm transition-all">
                  Já tenho conta
                </button>
              </div>
              <p className="text-white/20 text-xs mb-6">Sem cartão de crédito · Free para sempre · PWA instalável</p>
              <div className="flex items-center justify-center lg:justify-start gap-3">
                <div className="flex -space-x-2">
                  {['#6366f1','#8b5cf6','#ec4899','#10b981','#f59e0b'].map((c,i) => (
                    <div key={i} className="w-7 h-7 rounded-full border-2 flex items-center justify-center text-white text-[10px] font-bold" style={{ background: c, borderColor: '#070711' }}>
                      {String.fromCharCode(65+i)}
                    </div>
                  ))}
                </div>
                <div>
                  <div className="flex gap-0.5">{[1,2,3,4,5].map(i => <Star key={i} size={10} className="text-yellow-400 fill-yellow-400" />)}</div>
                  <p className="text-white/25 text-xs">Adorado por times de produto</p>
                </div>
              </div>
            </div>

            {/* Mockup */}
            <div className="flex-1 w-full max-w-[580px] pb-8">
              <KanbanPreview />
            </div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="border-y border-white/5 py-10" style={{ background: 'rgba(255,255,255,0.015)' }}>
        <div className="max-w-4xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-6 px-5 text-center">
          {[['10+','Módulos integrados'],['Gemini','IA de última geração'],['RLS','Dados isolados por usuário'],['PWA','Funciona offline']].map(([v,l]) => (
            <div key={l}>
              <p className="text-2xl font-black text-white mb-0.5">{v}</p>
              <p className="text-white/30 text-xs">{l}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section id="funcionalidades" className="py-20 px-5">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <p className="text-indigo-400 text-xs font-bold uppercase tracking-widest mb-2">Funcionalidades</p>
            <h2 className="text-3xl font-black mb-3">Tudo para produzir mais</h2>
            <p className="text-white/40 text-sm max-w-md mx-auto">Uma plataforma completa para projetos, reuniões e conhecimento da equipe.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <Feat icon={<Kanban size={18} />} color="#6366f1" title="Kanban Inteligente" desc="Colunas personalizáveis com cores por projeto, modo compacto e filtros avançados." />
            <Feat icon={<Brain size={18} />} color="#8b5cf6" title="Assistente IA (Nex)" desc="Descreva em linguagem natural e o Nex cria os cards com Gemini 2.5 Flash." />
            <Feat icon={<FileText size={18} />} color="#3b82f6" title="Atas com IA" desc="Cole transcrições e a IA gera ata completa com itens de ação para o Kanban." />
            <Feat icon={<BookOpen size={18} />} color="#14b8a6" title="Central de Notas" desc="Links, documentos e arquivos centralizados, organizados por tags e cores." />
            <Feat icon={<Target size={18} />} color="#f97316" title="Modo Foco + Pomodoro" desc="Timer Pomodoro integrado para eliminar distrações e registrar tempo por tarefa." />
            <Feat icon={<Bell size={18} />} color="#ec4899" title="Recorrência & Alertas" desc="Tarefas recorrentes com spawn automático e notificações push no prazo." />
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-16 px-5 border-y border-white/5" style={{ background: 'rgba(255,255,255,0.015)' }}>
        <div className="max-w-5xl mx-auto">
          <p className="text-center text-white/20 text-xs uppercase tracking-widest mb-10">O que dizem os usuários</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {[
              { name:'Ana Lima', role:'Product Manager', color:'#6366f1', text:'As atas com IA mudaram como conduzimos reuniões. O que levava 30 min agora leva 2.' },
              { name:'Carlos Melo', role:'Dev Lead', color:'#8b5cf6', text:'O Kanban com cores de projeto e modo compacto são exatamente o que precisávamos.' },
              { name:'Júlia Santos', role:'Freelancer', color:'#ec4899', text:'O Nex é surpreendente. Descrevo o projeto e ele cria toda a estrutura de tarefas.' },
            ].map(t => (
              <div key={t.name} className="p-5 rounded-2xl border border-white/8" style={{ background: 'rgba(255,255,255,0.03)' }}>
                <div className="flex gap-0.5 mb-3">{[1,2,3,4,5].map(i=><Star key={i} size={12} className="text-yellow-400 fill-yellow-400"/>)}</div>
                <p className="text-white/55 text-sm leading-relaxed mb-4">"{t.text}"</p>
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold" style={{ background: t.color }}>{t.name[0]}</div>
                  <div><p className="text-white font-semibold text-sm">{t.name}</p><p className="text-white/30 text-xs">{t.role}</p></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Why */}
      <section className="py-20 px-5">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-black mb-10">Por que escolher o TaskNexus?</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
            {[
              { icon:<Shield size={20} className="text-indigo-400"/>, bg:'rgba(99,102,241,0.15)', title:'Privacidade total', desc:'Row Level Security: nenhum outro usuário acessa seus dados.' },
              { icon:<Zap size={20} className="text-yellow-400"/>, bg:'rgba(245,158,11,0.15)', title:'Ultra rápido', desc:'Interface otimista — nenhuma ação espera o servidor.' },
              { icon:<Palette size={20} className="text-pink-400"/>, bg:'rgba(236,72,153,0.15)', title:'Personalizável', desc:'Cores, temas claro/escuro, modo compacto e muito mais.' },
            ].map(item => (
              <div key={item.title} className="flex flex-col items-center">
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-4 border border-white/10" style={{ background: item.bg }}>{item.icon}</div>
                <h3 className="font-bold text-white text-sm mb-1.5">{item.title}</h3>
                <p className="text-white/35 text-sm leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="py-16 px-5 border-t border-white/5" style={{ background: 'rgba(255,255,255,0.015)' }}>
        <div className="max-w-2xl mx-auto">
          <h2 className="text-2xl font-black text-center mb-8">Dúvidas frequentes</h2>
          <FAQ q="Preciso de cartão de crédito?" a="Não. O plano Free é gratuito para sempre sem necessidade de cartão." />
          <FAQ q="Meus dados ficam seguros?" a="Sim. Row Level Security (RLS) no Supabase garante que cada usuário só acessa os próprios dados." />
          <FAQ q="Funciona no celular?" a="Sim! É um PWA instalável pelo Chrome (Android) ou Safari (iPhone) sem precisar de loja de apps." />
          <FAQ q="A IA consome créditos?" a="No Free são 10 msgs/dia com o Nex. No plano Pro o uso de IA é ilimitado." />
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-5 text-center relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(ellipse at center, rgba(99,102,241,0.12) 0%, transparent 70%)' }} />
        <div className="relative max-w-xl mx-auto">
          <h2 className="text-3xl sm:text-4xl font-black mb-4">
            Pronto para{' '}
            <span style={{ background: 'linear-gradient(135deg,#6366f1,#a78bfa)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent' }}>
              produzir mais?
            </span>
          </h2>
          <p className="text-white/40 mb-8">Crie sua conta em menos de 1 minuto. Grátis, sem cartão.</p>
          <button onClick={() => setModal('signup')}
            className="inline-flex items-center gap-2 px-9 py-4 text-white font-bold rounded-2xl text-base transition-all hover:scale-105"
            style={{ background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', boxShadow: '0 14px 36px rgba(99,102,241,0.3)' }}>
            Começar agora — é grátis <ArrowRight size={18} />
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/5 py-7 px-5">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-white/20 text-xs">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg flex items-center justify-center" style={{ background: 'linear-gradient(135deg,#6366f1,#8b5cf6)' }}>
              <LayoutGrid size={11} className="text-white" />
            </div>
            TaskNexus © {new Date().getFullYear()}
          </div>
          <div className="flex items-center gap-1"><Users size={10} /> Feito para times produtivos</div>
          <div className="flex gap-5">
            <button onClick={() => setModal('login')} className="hover:text-white/50 transition-colors">Entrar</button>
            <button onClick={() => setModal('signup')} className="hover:text-white/50 transition-colors">Criar conta</button>
            <a href="mailto:joao.silvestrim@gmail.com" className="hover:text-white/50 transition-colors">Contato</a>
          </div>
        </div>
      </footer>

      {modal && <AuthModal defaultMode={modal} onClose={() => setModal(null)} />}
    </div>
  );
}
