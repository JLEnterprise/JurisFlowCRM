import React, { useState } from 'react';
import { Lock, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useCRM } from '../../context/CRMContext';
import { Modal } from '../common/Modal';

// Aparece quando o usuário abre o link "Esqueceu a senha" recebido por e-mail
export function PasswordRecoveryModal() {
  const { passwordRecovery, updatePassword } = useAuth();
  const { showToast } = useCRM();
  const [pwd, setPwd] = useState('');
  const [confirm, setConfirm] = useState('');
  const [show, setShow] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  if (!passwordRecovery) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (pwd.length < 8) {
      setError('A senha deve ter no mínimo 8 caracteres.');
      return;
    }
    if (pwd !== confirm) {
      setError('As senhas não conferem.');
      return;
    }
    setSaving(true);
    try {
      await updatePassword(pwd);
      showToast('Senha atualizada com sucesso!', 'success');
      setPwd('');
      setConfirm('');
    } catch (err) {
      setError('Não foi possível atualizar a senha. Solicite um novo link e tente novamente.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      isOpen
      onClose={() => {}}
      showCloseButton={false}
      title="Definir nova senha"
      subtitle="Escolha uma nova senha para acessar o JurisFlow"
      maxWidth="max-w-md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {[['Nova senha', pwd, setPwd], ['Confirmar nova senha', confirm, setConfirm]].map(([label, value, setter]) => (
          <div key={label}>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">{label}</label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                type={show ? 'text' : 'password'}
                required
                minLength={8}
                value={value}
                onChange={(e) => setter(e.target.value)}
                autoComplete="new-password"
                className="w-full rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-navy-900 pl-10 pr-10 py-2.5 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
              <button
                type="button"
                onClick={() => setShow(s => !s)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                aria-label={show ? 'Ocultar senha' : 'Mostrar senha'}
              >
                {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>
        ))}

        {error && (
          <div className="rounded-xl bg-rose-500/10 border border-rose-500/30 p-3 text-xs text-rose-600 dark:text-rose-300 font-medium">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={saving}
          className="w-full rounded-full bg-gradient-to-r from-brand-700 via-brand-600 to-brand-500 hover:brightness-110 disabled:opacity-60 py-2.5 text-sm font-semibold text-white transition"
        >
          {saving ? 'Salvando…' : 'Salvar nova senha'}
        </button>
      </form>
    </Modal>
  );
}
