import React, { useEffect, useState } from 'react';
import {
  User,
  Type,
  Users,
  Plug,
  Server,
  ShieldCheck,
  MessageSquare,
  Mail,
  PenLine,
  CalendarDays,
  CreditCard,
  Database,
  Globe,
  Github,
  Sparkles,
  Bot,
  Lock,
  KeyRound,
  LogOut,
  CheckCircle2,
  CircleDashed,
  Building2,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useCRM } from '../../context/CRMContext';
import { supabase } from '../../lib/supabase';
import { Avatar } from '../common/Avatar';
import { Select } from '../common/Select';
import { FontStylePicker } from '../layout/FontSwitcher';
import { TeamView } from '../team/TeamView';
import { ActivityLogsView } from '../security/ActivityLogsView';
import { AccessLevelsPanel } from './AccessLevelsPanel';
import { BranchesPanel } from './BranchesPanel';

// Integrações que cada escritório configura com a própria estrutura (número, e-mail, contas).
// Só dados não secretos ficam aqui; tokens e senhas vão para o cofre seguro do servidor (próxima etapa).
const OFFICE_INTEGRATIONS = [
  {
    id: 'whatsapp', name: 'WhatsApp', icon: MessageSquare,
    desc: 'Número oficial do escritório para mensagens, lembretes e cobranças.',
    providers: ['WhatsApp Business API (Meta)', 'Z-API', 'Evolution API'],
    fields: [{ key: 'numero', label: 'Número com DDD', placeholder: '(11) 99999-0000' }],
    secret: 'Token de acesso',
  },
  {
    id: 'email', name: 'E-mail', icon: Mail,
    desc: 'Remetente dos e-mails de propostas, cobranças e avisos aos clientes.',
    providers: ['Google Workspace', 'Microsoft 365', 'SMTP próprio'],
    fields: [
      { key: 'remetente', label: 'E-mail remetente', placeholder: 'contato@escritorio.adv.br' },
      { key: 'nome', label: 'Nome exibido', placeholder: 'Silva & Associados' },
    ],
    secret: 'Senha de app / SMTP',
  },
  {
    id: 'assinatura', name: 'Assinatura eletrônica', icon: PenLine,
    desc: 'Envio de contratos e procurações para assinatura digital.',
    providers: ['ZapSign', 'Clicksign', 'D4Sign'],
    fields: [{ key: 'conta', label: 'E-mail da conta', placeholder: 'financeiro@escritorio.adv.br' }],
    secret: 'Chave de API',
  },
  {
    id: 'agenda', name: 'Agenda externa', icon: CalendarDays,
    desc: 'Sincroniza audiências e compromissos com a agenda da equipe.',
    providers: ['Google Agenda', 'Outlook'],
    fields: [{ key: 'conta', label: 'Conta da agenda', placeholder: 'agenda@escritorio.adv.br' }],
    secret: 'Conexão por login (OAuth)',
  },
  {
    id: 'pagamentos', name: 'Cobrança & pagamentos', icon: CreditCard,
    desc: 'Boletos, PIX e links de pagamento das parcelas de honorários.',
    providers: ['Asaas', 'Mercado Pago', 'Stripe'],
    fields: [{ key: 'conta', label: 'Conta / e-mail', placeholder: 'financeiro@escritorio.adv.br' }],
    secret: 'Chave de API',
  },
];

// Agentes do Copiloto (n8n): um por ferramenta
const ADVJURIS_AGENTS = [
  { id: 'consultor', name: 'Consultor Jurídico' },
  { id: 'intimacoes', name: 'Intimações & Prazos' },
  { id: 'minutas', name: 'Peças & Minutas' },
  { id: 'whatsapp', name: 'WhatsApp do Cliente' },
];

export function SettingsHub({ onOpenProfile }) {
  const { currentUser, permissions, logout } = useAuth();
  const isPlatformAdmin = Boolean(permissions?.isDev);

  const [area, setArea] = useState('escritorio');
  const [tab, setTab] = useState('perfil');

  const officeTabs = [
    { id: 'perfil', label: 'Meu perfil', icon: User },
    { id: 'aparencia', label: 'Aparência', icon: Type },
    ...(permissions?.canAccessTeam ? [{ id: 'colaboradores', label: 'Colaboradores', icon: Users }] : []),
    ...(permissions?.canAccessSettings ? [{ id: 'acessos', label: 'Níveis de acesso', icon: KeyRound }] : []),
    ...(permissions?.isAdmin ? [{ id: 'filiais', label: 'Filiais', icon: Building2 }] : []),
    ...(permissions?.canAccessSettings ? [{ id: 'integracoes', label: 'Integrações do escritório', icon: Plug }] : []),
  ];
  const platformTabs = [
    { id: 'infra', label: 'Infraestrutura & APIs', icon: Server },
    { id: 'auditoria', label: 'Auditoria & LGPD', icon: ShieldCheck },
  ];
  const tabs = area === 'plataforma' ? platformTabs : officeTabs;

  const switchArea = (next) => {
    setArea(next);
    setTab(next === 'plataforma' ? 'infra' : 'perfil');
  };

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Chave: configurações do escritório x administração da plataforma (só Dev) */}
      {isPlatformAdmin && (
        <div className="funil-tabs" role="tablist" aria-label="Área das configurações">
          <button type="button" role="tab" aria-selected={area === 'escritorio'} onClick={() => switchArea('escritorio')}
            className={`funil-tab ${area === 'escritorio' ? 'is-active' : ''}`}>
            <Building2 className="h-3.5 w-3.5" /> <span>Escritório</span>
          </button>
          <button type="button" role="tab" aria-selected={area === 'plataforma'} onClick={() => switchArea('plataforma')}
            className={`funil-tab ${area === 'plataforma' ? 'is-active' : ''}`}>
            <Server className="h-3.5 w-3.5" /> <span>Plataforma (Admin)</span>
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[15rem_minmax(0,1fr)]">
        {/* Navegação lateral da página */}
        <nav className="dash-panel !p-2 h-fit" aria-label="Seções">
          {tabs.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              type="button"
              onClick={() => setTab(id)}
              aria-current={tab === id ? 'page' : undefined}
              className={`flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-left text-sm transition-colors ${
                tab === id
                  ? 'bg-gold-500/10 font-semibold text-slate-900 dark:text-gold-100'
                  : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/[0.04]'
              }`}
            >
              <Icon className={`h-4 w-4 ${tab === id ? 'text-gold-600 dark:text-gold-400' : 'text-slate-400'}`} />
              {label}
            </button>
          ))}
          <div className="my-2 border-t border-slate-100 dark:border-white/[0.06]" />
          <button type="button" onClick={logout}
            className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-left text-sm text-rose-600 dark:text-rose-400 hover:bg-rose-500/10">
            <LogOut className="h-4 w-4" /> Sair da sessão
          </button>
        </nav>

        <div className="min-w-0">
          {tab === 'perfil' && <ProfileSection user={currentUser} onEdit={onOpenProfile} />}
          {tab === 'aparencia' && (
            <Section title="Aparência" subtitle="Estilo de tipografia do sistema: títulos, rótulos, números e textos.">
              <FontStylePicker />
            </Section>
          )}
          {tab === 'colaboradores' && <TeamView />}
          {tab === 'acessos' && <AccessLevelsPanel />}
          {tab === 'filiais' && <BranchesPanel />}
          {tab === 'integracoes' && <OfficeIntegrations />}
          {tab === 'infra' && isPlatformAdmin && <PlatformInfra />}
          {tab === 'auditoria' && isPlatformAdmin && <ActivityLogsView />}
        </div>
      </div>
    </div>
  );
}

/* ============================== Peças ============================== */

function Section({ title, subtitle, children, aside }) {
  return (
    <section className="dash-panel">
      <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="font-display text-xl font-semibold text-slate-900 dark:text-white">{title}</h2>
          {subtitle && <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">{subtitle}</p>}
        </div>
        {aside}
      </div>
      {children}
    </section>
  );
}

function StatusPill({ ok, children }) {
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11px] font-semibold ${
      ok ? 'border-emerald-500/30 text-emerald-600 dark:text-emerald-400' : 'border-slate-300 text-slate-500 dark:border-white/[0.12] dark:text-slate-400'
    }`}>
      {ok ? <CheckCircle2 className="h-3 w-3" /> : <CircleDashed className="h-3 w-3" />}
      {children}
    </span>
  );
}

function ProfileSection({ user, onEdit }) {
  const rows = [
    ['Nome', user?.name],
    ['E-mail', user?.email],
    ['Cargo', user?.title || user?.role],
    ['OAB', user?.oab],
    ['Telefone', user?.phone],
  ];
  return (
    <Section
      title="Meu perfil"
      subtitle="Seus dados pessoais e a foto que aparece no sistema."
      aside={
        <button type="button" onClick={onEdit}
          className="rounded-full bg-gradient-to-r from-brand-700 via-brand-600 to-brand-500 px-4 py-2 text-xs font-semibold tracking-wide text-white shadow-md shadow-brand-900/20 hover:brightness-110 transition">
          Editar perfil e foto
        </button>
      }
    >
      <div className="flex flex-col gap-6 sm:flex-row sm:items-start">
        <Avatar src={user?.avatar} name={user?.name} size="2xl" />
        <dl className="grid flex-1 grid-cols-1 gap-x-6 gap-y-3 sm:grid-cols-2">
          {rows.map(([label, value]) => (
            <div key={label}>
              <dt className="text-[0.65rem] font-semibold uppercase tracking-[0.14em] text-slate-400">{label}</dt>
              <dd className="mt-0.5 text-sm text-slate-900 dark:text-white">{value || '—'}</dd>
            </div>
          ))}
        </dl>
      </div>
      <ChangePasswordBox />
    </Section>
  );
}

// Trocar a própria senha, já logado (sem precisar do e-mail de redefinição)
function ChangePasswordBox() {
  const { updatePassword } = useAuth();
  const { showToast } = useCRM();
  const [open, setOpen] = useState(false);
  const [pwd, setPwd] = useState('');
  const [confirm, setConfirm] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    if (pwd.length < 8 || !/[a-zA-Z]/.test(pwd) || !/\d/.test(pwd)) {
      setError('Use pelo menos 8 caracteres, com letras e números.');
      return;
    }
    if (pwd !== confirm) {
      setError('As senhas não conferem.');
      return;
    }
    setSaving(true);
    try {
      await updatePassword(pwd);
      showToast && showToast('Senha alterada com sucesso!', 'success');
      setPwd(''); setConfirm(''); setOpen(false);
    } catch (err) {
      const msg = (err?.message || '').toLowerCase();
      setError(msg.includes('pwned') || msg.includes('leaked') || msg.includes('weak')
        ? 'Essa senha é fraca ou já apareceu em vazamentos na internet. Escolha outra.'
        : msg.includes('different')
          ? 'A nova senha precisa ser diferente da atual.'
          : 'Não foi possível alterar a senha agora. Saia e entre de novo e tente outra vez.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mt-6 border-t border-slate-200/80 pt-5 dark:border-white/[0.06]">
      {!open ? (
        <button type="button" onClick={() => setOpen(true)} className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-3.5 py-2 text-xs font-semibold text-slate-700 transition-colors hover:border-gold-500/40 dark:border-white/[0.08] dark:text-slate-200">
          <KeyRound className="h-3.5 w-3.5 text-gold-600 dark:text-gold-400" /> Alterar minha senha
        </button>
      ) : (
        <form onSubmit={submit} className="grid max-w-xl grid-cols-1 gap-3 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-xs font-semibold text-slate-600 dark:text-slate-300">Nova senha</label>
            <input type="password" autoComplete="new-password" value={pwd} onChange={(e) => setPwd(e.target.value)} className={inputClass} />
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold text-slate-600 dark:text-slate-300">Confirmar nova senha</label>
            <input type="password" autoComplete="new-password" value={confirm} onChange={(e) => setConfirm(e.target.value)} className={inputClass} />
          </div>
          {error && <p className="text-xs font-medium text-rose-600 dark:text-rose-400 sm:col-span-2">{error}</p>}
          <div className="flex items-center gap-2 sm:col-span-2">
            <button type="submit" disabled={saving} className="rounded-full bg-gradient-to-r from-brand-700 via-brand-600 to-brand-500 px-4 py-2 text-xs font-bold text-white shadow-md transition hover:brightness-110 disabled:opacity-50">
              {saving ? 'Salvando…' : 'Salvar nova senha'}
            </button>
            <button type="button" onClick={() => { setOpen(false); setError(''); }} className="premium-link">Cancelar</button>
          </div>
        </form>
      )}
    </div>
  );
}

const inputClass = 'w-full rounded-xl border border-slate-200 dark:border-white/[0.08] bg-white dark:bg-white/[0.03] px-3.5 py-2.5 text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:border-gold-500/60 focus:outline-none';

function OfficeIntegrations() {
  const { officeSettings, updateOfficeSettings, showToast } = useCRM();
  const saved = officeSettings?.integrations || {};

  return (
    <Section
      title="Integrações do escritório"
      subtitle="Conecte a estrutura própria do escritório: número de WhatsApp, e-mail, assinatura, agenda e cobrança."
    >
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        {OFFICE_INTEGRATIONS.map(integ => (
          <IntegrationCard
            key={integ.id}
            integ={integ}
            value={saved[integ.id] || {}}
            onSave={(data) => {
              updateOfficeSettings({ integrations: { ...saved, [integ.id]: data } });
              showToast(`${integ.name}: dados salvos.`);
            }}
          />
        ))}
      </div>
      <p className="mt-4 flex items-start gap-2 text-[11px] leading-relaxed text-slate-500 dark:text-slate-400">
        <Lock className="mt-0.5 h-3.5 w-3.5 shrink-0 text-gold-500" />
        Tokens, senhas e chaves de API não ficam salvos no navegador nem visíveis para a equipe: serão guardados num cofre seguro no servidor.
        Enquanto isso, você já pode deixar provedor, número e e-mail cadastrados.
      </p>
    </Section>
  );
}

function IntegrationCard({ integ, value, onSave }) {
  const [draft, setDraft] = useState(value);
  useEffect(() => { setDraft(value); }, [value]);
  const Icon = integ.icon;
  const configured = Boolean(draft.provider) && integ.fields.every(f => String(value[f.key] || '').trim());
  const dirty = JSON.stringify(draft) !== JSON.stringify(value);

  return (
    <div className="rounded-2xl border border-slate-200 dark:border-white/[0.08] p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-gold-500/35 bg-gold-500/[0.08] text-gold-600 dark:text-gold-400">
            <Icon className="h-4 w-4" />
          </span>
          <div>
            <div className="font-semibold text-slate-900 dark:text-white">{integ.name}</div>
            <p className="text-xs text-slate-500 dark:text-slate-400">{integ.desc}</p>
          </div>
        </div>
        <StatusPill ok={configured}>{configured ? 'Cadastrado' : 'Não conectado'}</StatusPill>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label className="mb-1.5 block text-[0.65rem] font-semibold uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400">Provedor</label>
          <Select value={draft.provider || ''} onChange={(e) => setDraft({ ...draft, provider: e.target.value })} className="w-full">
            <option value="">Selecione...</option>
            {integ.providers.map(p => <option key={p} value={p}>{p}</option>)}
          </Select>
        </div>
        {integ.fields.map(f => (
          <div key={f.key}>
            <label className="mb-1.5 block text-[0.65rem] font-semibold uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400">{f.label}</label>
            <input
              value={draft[f.key] || ''}
              onChange={(e) => setDraft({ ...draft, [f.key]: e.target.value })}
              placeholder={f.placeholder}
              className={inputClass}
            />
          </div>
        ))}
        <div className={integ.fields.length % 2 === 0 ? 'sm:col-span-2' : ''}>
          <label className="mb-1.5 flex items-center gap-1.5 text-[0.65rem] font-semibold uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400">
            <Lock className="h-3 w-3 text-gold-500" /> {integ.secret}
          </label>
          <input disabled placeholder="Cofre seguro do servidor · em breve" className={`${inputClass} cursor-not-allowed opacity-60`} />
        </div>
      </div>

      <div className="mt-4 flex justify-end">
        <button
          type="button"
          disabled={!dirty}
          onClick={() => onSave(draft)}
          className="rounded-full border border-gold-500/40 px-4 py-1.5 text-xs font-semibold text-gold-700 dark:text-gold-300 hover:bg-gold-500/10 disabled:opacity-40 transition-colors"
        >
          Salvar
        </button>
      </div>
    </div>
  );
}

function PlatformInfra() {
  const [db, setDb] = useState({ state: 'checking' });
  const projectUrl = supabase?.supabaseUrl || '';
  const projectRef = (projectUrl.match(/https:\/\/([^.]+)\./) || [])[1] || '—';

  useEffect(() => {
    let alive = true;
    const started = performance.now();
    supabase.from('office_settings').select('id', { count: 'exact', head: true })
      .then(({ error }) => {
        if (!alive) return;
        setDb(error ? { state: 'error', message: error.message } : { state: 'ok', ms: Math.round(performance.now() - started) });
      });
    return () => { alive = false; };
  }, []);

  const cards = [
    {
      icon: Database, name: 'Supabase', desc: 'Banco de dados, login dos usuários e arquivos.',
      ok: db.state === 'ok',
      status: db.state === 'checking' ? 'Verificando...' : db.state === 'ok' ? `Conectado · ${db.ms} ms` : 'Erro de conexão',
      detail: `Projeto ${projectRef}`,
    },
    {
      icon: Globe, name: 'Vercel', desc: 'Hospedagem do sistema e publicação automática.',
      ok: true, status: 'No ar', detail: window.location.host,
    },
    {
      icon: Github, name: 'GitHub', desc: 'Código-fonte e backup automático de hora em hora.',
      ok: true, status: 'Ativo', detail: 'JLEnterprise/JurisFlowCRM',
    },
    {
      icon: Sparkles, name: 'Modelos de IA', desc: 'Motor de IA do Copiloto (Claude, ChatGPT etc.).',
      ok: false, status: 'Não conectado', detail: 'A chave fica no servidor, nunca no navegador.',
    },
  ];

  return (
    <div className="space-y-5">
      <Section title="Infraestrutura & APIs" subtitle="Serviços que mantêm a plataforma no ar. Visível só para o administrador da plataforma.">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {cards.map(c => {
            const Icon = c.icon;
            return (
              <div key={c.name} className="rounded-2xl border border-slate-200 dark:border-white/[0.08] p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-gold-500/35 bg-gold-500/[0.08] text-gold-600 dark:text-gold-400">
                      <Icon className="h-4 w-4" />
                    </span>
                    <div>
                      <div className="font-semibold text-slate-900 dark:text-white">{c.name}</div>
                      <p className="text-xs text-slate-500 dark:text-slate-400">{c.desc}</p>
                    </div>
                  </div>
                  <StatusPill ok={c.ok}>{c.status}</StatusPill>
                </div>
                <p className="mt-3 truncate text-[11px] text-slate-400">{c.detail}</p>
              </div>
            );
          })}
        </div>
      </Section>

      <Section title="Agentes AdvJuris (n8n)" subtitle="Um agente por ferramenta do Copiloto. Cada um será ligado ao seu webhook do n8n.">
        <ul className="divide-y divide-slate-100 dark:divide-white/[0.05]">
          {ADVJURIS_AGENTS.map(agent => (
            <li key={agent.id} className="flex items-center justify-between gap-3 py-3">
              <span className="flex items-center gap-2.5 text-sm text-slate-800 dark:text-slate-200">
                <Bot className="h-4 w-4 text-gold-500" /> {agent.name}
              </span>
              <StatusPill ok={false}>Aguardando webhook</StatusPill>
            </li>
          ))}
        </ul>
        <p className="mt-3 text-[11px] text-slate-500 dark:text-slate-400">
          Enquanto os agentes não estão ligados, o Copiloto usa o agente nativo (respostas prontas).
        </p>
      </Section>
    </div>
  );
}
