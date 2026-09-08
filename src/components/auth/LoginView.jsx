import React, { useState } from 'react';
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
import { BrandLogo } from '../common/BrandLogo';

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

    if (regPassword.length < 4) {
      showToast('A senha deve conter no mínimo 4 caracteres.', 'warning');
      return;
    }

    const titleMap = {
      lawyer: 'Advogado(a)',
      financial: 'Financeiro',
      secretary: 'Administrativo',
      sales: 'Comercial / SDR',
    };

    const chosenTitle = titleMap[regRole] || 'Advogado(a)';

    const success = await registerUser({
      name: regName,
      email: regEmail,
      password: regPassword,
      role: regRole,
      roles: [regRole],
      title: chosenTitle,
      titles: [chosenTitle],
      firmName: regFirmName || 'JurisFlow Advocacia',
      escritorio_id: inviteCode || null // Atribui ao escritório que convidou, se houver
    });

    if (success) {
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
    <div className="min-h-screen w-full flex items-center justify-center p-4 bg-gradient-to-br from-slate-900 via-navy-950 to-slate-900 selection:bg-brand-500 selection:text-white relative overflow-hidden">
      {/* Elementos Decorativos de Fundo */}
      <div className="absolute -top-40 -right-40 w-96 h-96 rounded-full bg-brand-600/10 blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 -left-40 w-96 h-96 rounded-full bg-gold-600/10 blur-3xl pointer-events-none" />

      <div className="w-full max-w-md animate-fade-in relative z-10">
        {/* Logotipo e Identidade */}
        <div className="text-center mb-6 flex flex-col items-center">
          <BrandLogo className="h-16 w-16 mb-3" iconSize="h-8 w-8" />
          <h1 className="text-2xl font-extrabold text-white tracking-tight">
            JurisFlow <span className="text-gold-400 font-serif italic">CRM</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1 font-medium">
            Sistema Integrado de Gestão Comercial Jurídica
          </p>
        </div>

        {/* Card Principal (Login / Cadastro) */}
        <div className="rounded-3xl bg-white/10 dark:bg-navy-900/80 backdrop-blur-xl border border-white/10 dark:border-slate-800 p-8 shadow-2xl space-y-6">
          
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
                <label className="block text-xs font-semibold text-slate-300 mb-1">
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
                <label className="block text-xs font-semibold text-slate-300 mb-1">
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

              <button
                type="submit"
                disabled={isLoading}
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-brand-600 to-brand-500 py-3 text-sm font-bold text-white shadow-lg shadow-brand-500/25 hover:from-brand-500 hover:to-brand-600 transition-all hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50"
              >
                {isLoading ? (
                  <div className="h-5 w-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <span>Entrar no Sistema</span>
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </button>

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
                <label className="block text-xs font-semibold text-slate-300 mb-1">
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
                <label className="block text-xs font-semibold text-slate-300 mb-1">
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
                <label className="block text-xs font-semibold text-slate-300 mb-1">
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
                <label className="block text-xs font-semibold text-slate-300 mb-1">
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
                <label className="block text-xs font-semibold text-slate-300 mb-1">
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

              <button
                type="submit"
                disabled={isLoading}
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-gold-500 to-amber-600 py-3 text-sm font-bold text-navy-950 shadow-lg shadow-gold-500/20 hover:from-gold-400 hover:to-amber-500 transition-all hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 mt-2"
              >
                {isLoading ? (
                  <div className="h-5 w-5 border-2 border-navy-950/30 border-t-navy-950 rounded-full animate-spin" />
                ) : (
                  <>
                    <CheckCircle2 className="h-4 w-4" />
                    <span>Criar Minha Conta no CRM</span>
                  </>
                )}
              </button>

              <div className="text-center pt-1">
                <button
                  type="button"
                  onClick={() => setIsRegisterMode(false)}
                  className="text-xs text-slate-400 hover:text-white transition-colors font-medium"
                >
                  Já possui uma conta? <span className="text-brand-400 underline font-bold">Fazer Login</span>
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Rodape do Sistema */}
        <div className="text-center mt-6 text-[11px] text-slate-500 font-medium">
          JurisFlow CRM &copy; 2026 • Plataforma Comercial Jurídica Segura
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
