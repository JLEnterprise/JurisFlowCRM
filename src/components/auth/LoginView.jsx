import React, { useId, useState } from 'react';
import {
  Scale,
  Lock,
  Mail,
  Eye,
  EyeOff,
  ArrowRight,
  User,
  Building2,
  Briefcase,
  UserPlus,
  LogIn,
  CheckCircle2
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useCRM } from '../../context/CRMContext';
import { Modal } from '../common/Modal';
import logoEmblema from '../../assets/logo-emblema.png';

// Estrela cadente do botão: muitas camadas finas e translúcidas que terminam no
// mesmo ponto (a cabeça). Elas se sobrepõem perto da cabeça e rareiam na ponta da
// cauda, formando um degradê contínuo; o filtro de brilho (bloom) esconde as emendas.
const COMET_TAIL_LENGTH = 26;   // % do contorno
const COMET_TAIL_LAYERS = 30;
const COMET_LAYERS = [
  ...Array.from({ length: COMET_TAIL_LAYERS }, (_, i) => {
    const t = (i + 1) / COMET_TAIL_LAYERS;           // 0 → cabeça, 1 → fim da cauda
    const len = COMET_TAIL_LENGTH * t * t;           // camadas concentradas junto à cabeça
    const warm = Math.round(255 - 40 * t);           // branco → dourado ao longo da cauda
    return { len, width: 1.4 + 0.8 * (1 - t), color: `rgb(255 ${warm} ${Math.round(warm * 0.72)} / 0.14)` };
  }),
  { len: 0.5, width: 2.6, color: 'rgb(255 255 255 / 0.9)' },
  { len: 0.2, width: 3.4, color: '#ffffff' }
];

// Botão principal com a estrela cadente contornando a borda e brilho pulsante no hover.
function CometButton({ className = '', children, ...props }) {
  const glowId = `comet-glow-${useId().replace(/:/g, '')}`;
  return (
    <div className="btn-comet">
      <svg className="btn-comet__orbit" aria-hidden="true">
        <defs>
          <filter id={glowId} x="-20%" y="-50%" width="140%" height="200%">
            <feGaussianBlur in="SourceGraphic" stdDeviation="2.2" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
        <g filter={`url(#${glowId})`}>
          {COMET_LAYERS.map(({ len, width, color }, i) => (
            <rect
              key={i}
              pathLength="100"
              strokeDasharray={`${len} ${100 - len}`}
              style={{ '--len': len, strokeWidth: width, stroke: color }}
            />
          ))}
        </g>
      </svg>
      <button {...props} className={`btn-comet__inner w-full flex items-center justify-center gap-2.5 py-3.5 text-[0.8rem] font-semibold uppercase tracking-[0.18em] active:scale-[0.99] transition-transform disabled:opacity-50 ${className}`}>
        {children}
      </button>
    </div>
  );
}

export function LoginView() {
  const { login, registerUser, authError, isLoading, resetPassword } = useAuth();
  const { showToast } = useCRM();

  // Modo: false = Login ("Entrar"), true = Cadastro ("Criar Conta")
  const [isRegisterMode, setIsRegisterMode] = useState(false);

  // Captura código de convite da URL (ex: ?invite=escritorio_Tatiane)
  const urlParams = new URLSearchParams(window.location.search);
  const inviteCode = urlParams.get('invite');

  // Campos de Login
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // Campos de Registro
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regFirmName, setRegFirmName] = useState('');
  const [regRole, setRegRole] = useState('lawyer');

  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);

  // Modal de recuperacao de senha
  const [recoveryOpen, setRecoveryOpen] = useState(false);
  const [recoveryEmail, setRecoveryEmail] = useState('');
  const [recoverySent, setRecoverySent] = useState(false);

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    if (!loginEmail || !loginPassword) return;
    const success = await login(loginEmail, loginPassword, rememberMe);
    if (success) {
      showToast('Bem-vindo(a) ao JurisFlow CRM!', 'success');
    }
  };

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    if (!regName || !regEmail || !regPassword) return;

    if (regPassword.length < 8) {
      showToast('A senha deve conter no mínimo 8 caracteres.', 'warning');
      return;
    }

    const result = await registerUser({
      name: regName,
      email: regEmail,
      password: regPassword,
      firmName: regFirmName || 'JurisFlow Advocacia',
      escritorio_id: inviteCode || null // convite: o admin precisa ter cadastrado este e-mail em Equipe
    });

    if (result?.ok && result.needsConfirmation) {
      showToast('Conta criada! Enviamos um link de confirmação para o seu e-mail. Confirme e depois clique em Entrar.', 'success');
      setIsRegisterMode(false);
      setLoginEmail(regEmail);
    } else if (result?.ok) {
      showToast('Conta criada com sucesso! Acessando a plataforma...', 'success');
    }
  };

  const handleRecoverySubmit = async (e) => {
    e.preventDefault();
    if (!recoveryEmail) return;
    await resetPassword(recoveryEmail);
    setRecoverySent(true);
    showToast('Instruções de redefinição enviadas para o e-mail informado!', 'info');
  };

  return (
    <div className="login-premium min-h-screen w-full flex items-center justify-center bg-[#060a13] selection:bg-gold-500 selection:text-navy-950 relative overflow-hidden">
      {/* Fundo: luzes, grade fina e poeira dourada */}
      <div className="login-bg" aria-hidden="true">
        <div className="login-bg__grid" />
        <div className="login-bg__glow login-bg__glow--gold" />
        <div className="login-bg__glow login-bg__glow--blue" />
        <div className="login-bg__dust" />
      </div>

      <div className="relative z-10 w-full max-w-6xl grid lg:grid-cols-[1.15fr_1fr] items-center gap-8 lg:gap-16 px-4 sm:px-8 py-10">
        {/* Marca: emblema em destaque */}
        <section className="flex flex-col items-center text-center">
          <div className="login-emblem">
            <div className="login-emblem__halo" />
            <div className="login-emblem__ring login-emblem__ring--outer"><span /></div>
            <div className="login-emblem__ring login-emblem__ring--inner" />
            <img src={logoEmblema} alt="" className="login-emblem__img" draggable="false" />
            <div className="login-emblem__shine" style={{ '--emblem-src': `url(${logoEmblema})` }} />
          </div>

          <h1 className="login-wordmark font-display mt-6 lg:mt-8">JurisFlow</h1>
          <div className="login-reveal flex items-center gap-3 mt-3" style={{ animationDelay: '0.5s' }} aria-hidden="true">
            <span className="h-px w-12 bg-gradient-to-r from-transparent to-gold-500/70" />
            <span className="h-1.5 w-1.5 rotate-45 bg-gold-400" />
            <span className="h-px w-12 bg-gradient-to-l from-transparent to-gold-500/70" />
          </div>
          <p className="login-reveal text-[0.68rem] text-gold-200/70 mt-3 font-semibold uppercase tracking-[0.42em]" style={{ animationDelay: '0.6s' }}>
            CRM Jurídico
          </p>

          <p className="login-reveal hidden lg:block font-display italic text-[1.7rem] leading-snug text-slate-200/90 mt-10 max-w-md" style={{ animationDelay: '0.8s' }}>
            A excelência da sua advocacia, agora também na gestão.
          </p>
          <div className="login-reveal hidden lg:flex items-center gap-4 mt-5 text-[0.62rem] font-semibold uppercase tracking-[0.3em] text-slate-400" style={{ animationDelay: '1s' }}>
            <span>Contratos</span>
            <span className="h-1 w-1 rotate-45 bg-gold-500/80" />
            <span>Processos</span>
            <span className="h-1 w-1 rotate-45 bg-gold-500/80" />
            <span>Honorários</span>
          </div>
        </section>

        <div className="w-full max-w-md mx-auto lg:mr-0 login-reveal" style={{ animationDelay: '0.3s' }}>
        {/* Card Principal (Login / Cadastro) */}
        <div className="login-card rounded-3xl p-8 space-y-6">
          
          {/* Seletor de Abas (Entrar / Criar Conta) */}
          <div className="flex rounded-2xl bg-black/30 p-1 border border-white/10">
            <button
              type="button"
              onClick={() => setIsRegisterMode(false)}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold transition-all ${
                !isRegisterMode
                  ? 'bg-gradient-to-r from-brand-600 to-brand-500 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <LogIn className="h-4 w-4" />
              Entrar
            </button>
            <button
              type="button"
              onClick={() => setIsRegisterMode(true)}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold transition-all ${
                isRegisterMode
                  ? 'bg-gradient-to-r from-brand-600 to-brand-500 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <UserPlus className="h-4 w-4" />
              Criar Conta
            </button>
          </div>

          {authError && (
            <div className="rounded-xl bg-rose-500/20 border border-rose-500/30 p-3 text-xs text-rose-200 font-medium animate-fade-in">
              {authError}
            </div>
          )}

          {/* FORMULÁRIO DE LOGIN */}
          {!isRegisterMode ? (
            <form onSubmit={handleLoginSubmit} className="space-y-4">
              <div>
                <label className="login-label">
                  E-mail Corporativo
                </label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <input
                    type="email"
                    required
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    placeholder="seu.email@escritorio.adv.br"
                    className="w-full rounded-xl border border-white/10 bg-black/20 pl-10 pr-4 py-2.5 text-sm text-white placeholder-slate-500 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                  />
                </div>
              </div>

              <div>
                <label className="login-label">
                  Senha de Acesso
                </label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="w-full rounded-xl border border-white/10 bg-black/20 pl-10 pr-10 py-2.5 text-sm text-white placeholder-slate-500 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between text-xs">
                <label className="flex items-center gap-2 text-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="rounded border-white/20 bg-black/20 text-brand-500 focus:ring-0"
                  />
                  <span>Lembrar-me</span>
                </label>

                <button
                  type="button"
                  onClick={() => {
                    setRecoverySent(false);
                    setRecoveryEmail(loginEmail);
                    setRecoveryOpen(true);
                  }}
                  className="text-gold-400 hover:text-gold-300 font-medium hover:underline"
                >
                  Esqueceu a senha?
                </button>
              </div>

              <CometButton
                type="submit"
                disabled={isLoading}
                className="bg-gradient-to-r from-brand-700 via-brand-600 to-brand-500 text-white"
              >
                {isLoading ? (
                  <div className="h-5 w-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <span>Entrar no Sistema</span>
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </CometButton>

              <div className="text-center pt-2">
                <button
                  type="button"
                  onClick={() => setIsRegisterMode(true)}
                  className="text-xs text-slate-400 hover:text-gold-400 transition-colors font-medium"
                >
                  Não possui uma conta? <span className="text-gold-400 underline font-bold">Cadastre-se aqui</span>
                </button>
              </div>
            </form>
          ) : (
            /* FORMULARIO DE REGISTRO / CADASTRO */
            <form onSubmit={handleRegisterSubmit} className="space-y-3.5 animate-fade-in">
              {inviteCode && (
                <div className="rounded-xl bg-brand-500/10 border border-brand-500/20 p-3 text-xs text-brand-300 font-medium flex items-start gap-2 mb-2">
                  <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5" />
                  <div>
                    Você foi convidado(a) para ingressar em um escritório. Complete seu cadastro abaixo.
                  </div>
                </div>
              )}
              
              <div>
                <label className="login-label">
                  Nome Completo
                </label>
                <div className="relative">
                  <User className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <input
                    type="text"
                    required
                    value={regName}
                    onChange={(e) => setRegName(e.target.value)}
                    placeholder="Dr. João Silva"
                    className="w-full rounded-xl border border-white/10 bg-black/20 pl-10 pr-4 py-2 text-sm text-white placeholder-slate-500 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                  />
                </div>
              </div>

              <div>
                <label className="login-label">
                  E-mail Corporativo
                </label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <input
                    type="email"
                    required
                    value={regEmail}
                    onChange={(e) => setRegEmail(e.target.value)}
                    placeholder="joao@escritorio.adv.br"
                    className="w-full rounded-xl border border-white/10 bg-black/20 pl-10 pr-4 py-2 text-sm text-white placeholder-slate-500 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                  />
                </div>
              </div>

              <div>
                <label className="login-label">
                  Nome do Escritório / Empresa
                </label>
                <div className="relative">
                  <Building2 className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <input
                    type="text"
                    value={regFirmName}
                    onChange={(e) => setRegFirmName(e.target.value)}
                    placeholder="Silva & Advogados Associados"
                    className="w-full rounded-xl border border-white/10 bg-black/20 pl-10 pr-4 py-2 text-sm text-white placeholder-slate-500 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                  />
                </div>
              </div>

              <div>
                <label className="login-label">
                  Função / Cargo Inicial
                </label>
                <div className="relative">
                  <Briefcase className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <select
                    value={regRole}
                    onChange={(e) => setRegRole(e.target.value)}
                    className="w-full rounded-xl border border-white/10 bg-black/20 pl-10 pr-4 py-2 text-sm text-white focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 appearance-none cursor-pointer"
                  >
                    <option value="lawyer" className="bg-navy-950 text-white">Advogado(a)</option>
                    <option value="financial" className="bg-navy-950 text-white">Financeiro</option>
                    <option value="secretary" className="bg-navy-950 text-white">Administrativo</option>
                    <option value="sales" className="bg-navy-950 text-white">Comercial / SDR</option>
                  </select>
                </div>
                <p className="text-[10px] text-slate-400 mt-1 leading-relaxed">
                  * O Administrador da banca poderá atribuir múltiplos cargos, especialidades e autorizações no painel da Equipe.
                </p>
              </div>

              <div>
                <label className="login-label">
                  Senha de Acesso
                </label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={regPassword}
                    onChange={(e) => setRegPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="w-full rounded-xl border border-white/10 bg-black/20 pl-10 pr-10 py-2 text-sm text-white placeholder-slate-500 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <div className="pt-2">
                <CometButton
                  type="submit"
                  disabled={isLoading}
                  className="bg-gradient-to-r from-brand-700 via-brand-600 to-brand-500 text-white"
                >
                  {isLoading ? (
                    <div className="h-5 w-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      <CheckCircle2 className="h-4 w-4" />
                      <span>Criar Minha Conta</span>
                    </>
                  )}
                </CometButton>
              </div>

              <div className="text-center pt-1">
                <button
                  type="button"
                  onClick={() => setIsRegisterMode(false)}
                  className="text-xs text-slate-400 hover:text-gold-400 transition-colors font-medium"
                >
                  Já possui uma conta? <span className="text-gold-400 underline font-bold">Fazer Login</span>
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Rodape do Sistema */}
        <div className="text-center mt-6 text-[0.65rem] text-slate-500 font-medium tracking-[0.12em]">
          JurisFlow CRM &copy; 2026 · Plataforma Jurídica Segura
        </div>
        </div>
      </div>

      {/* Modal de Recuperacao de Senha */}
      <Modal
        isOpen={recoveryOpen}
        onClose={() => setRecoveryOpen(false)}
        title="Recuperação de Senha"
        subtitle="Informe seu e-mail corporativo para receber as instruções de redefinição"
        maxWidth="max-w-md"
      >
        <form onSubmit={handleRecoverySubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              E-mail de Cadastro
            </label>
            <input
              type="email"
              required
              value={recoveryEmail}
              onChange={(e) => setRecoveryEmail(e.target.value)}
              placeholder="seu.email@escritorio.adv.br"
              className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-navy-950 px-3.5 py-2 text-sm text-slate-900 dark:text-white focus:border-brand-500 focus:outline-none"
            />
          </div>

          <button
            type="submit"
            className="w-full flex items-center justify-center gap-2 rounded-xl bg-brand-600 hover:bg-brand-700 py-2.5 text-xs font-bold text-white shadow-md transition-all"
          >
            Enviar Instruções por E-mail
          </button>
        </form>
      </Modal>
    </div>
  );
}
