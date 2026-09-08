import React, { useState, useEffect } from 'react';
import {
  User,
  Mail,
  Phone,
  Briefcase,
  Shield,
  Upload,
  Trash2,
  Save,
  CheckCircle2,
  Building2,
  Sparkles,
  Scale
} from 'lucide-react';
import { Modal } from './Modal';
import { Avatar } from './Avatar';
import { useAuth } from '../../context/AuthContext';
import { useCRM } from '../../context/CRMContext';
import { compressAvatarImage } from '../../utils/imageUtils';

export function UserProfileModal({ isOpen, onClose }) {
  const { currentUser, updateProfile, permissions } = useAuth();
  const { showToast, logActivity } = useCRM();

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    oab: '',
    title: '',
    firmName: '',
    avatar: '',
  });

  const [isSaving, setIsSaving] = useState(false);
  const [isCompressing, setIsCompressing] = useState(false);

  useEffect(() => {
    if (currentUser && isOpen) {
      setFormData({
        name: currentUser.name || '',
        email: currentUser.email || '',
        phone: currentUser.phone || '',
        oab: currentUser.oab || '',
        title: currentUser.title || 'Advogado(a)',
        firmName: currentUser.firmName || 'JurisFlow Advocacia',
        avatar: currentUser.avatar || '',
      });
    }
  }, [currentUser, isOpen]);

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setIsCompressing(true);
      try {
        const compressedBase64 = await compressAvatarImage(file, 256, 0.85);
        if (compressedBase64) {
          setFormData(prev => ({ ...prev, avatar: compressedBase64 }));
          showToast('Foto processada e pronta para salvar!', 'success');
        }
      } catch (err) {
        console.error('Erro ao processar foto:', err);
        showToast('Não foi possível processar a foto. Tente outra imagem.', 'danger');
      } finally {
        setIsCompressing(false);
      }
    }
  };

  const handleRemoveAvatar = () => {
    setFormData(prev => ({ ...prev, avatar: '' }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.email.trim()) {
      showToast('Nome completo e e-mail corporativo são obrigatórios.', 'danger');
      return;
    }

    setIsSaving(true);
    try {
      if (updateProfile) {
        await updateProfile({
          ...formData,
          name: formData.name.trim(),
          email: formData.email.trim(),
          phone: formData.phone.trim(),
          oab: formData.oab.trim(),
          title: formData.title.trim(),
          firmName: formData.firmName.trim(),
        });
      }
      if (logActivity) {
        logActivity('Perfil de Usuário', formData.name, 'Informações pessoais e foto de perfil atualizadas.');
      }
      showToast('Perfil atualizado com sucesso no sistema e no Supabase!', 'success');
      onClose();
    } catch (err) {
      console.error('Erro ao atualizar perfil:', err);
      showToast('Erro ao atualizar o perfil. As alterações foram salvas localmente.', 'warning');
      onClose();
    } finally {
      setIsSaving(false);
    }
  };

  const isUserAdmin = permissions?.isAdmin || currentUser?.role === 'admin' || currentUser?.roles?.includes('admin');

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Meu Perfil Pessoal & Foto"
      subtitle="Gerencie suas informações profissionais, credenciais da OAB e foto de perfil"
      maxWidth="max-w-xl"
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Seção da Foto de Perfil */}
        <div className="flex flex-col sm:flex-row items-center gap-5 p-4 rounded-2xl bg-slate-50/70 dark:bg-navy-950/60 border border-slate-200/80 dark:border-slate-800">
          <div className="relative shrink-0">
            <Avatar
              src={formData.avatar}
              name={formData.name || 'Meu Perfil'}
              size="xl"
            />
            {isUserAdmin && (
              <div className="absolute -bottom-1 -right-1 bg-amber-500 text-white p-1 rounded-full shadow-md border-2 border-white dark:border-navy-900" title="Sócia Administradora">
                <Shield className="h-3.5 w-3.5" />
              </div>
            )}
          </div>

          <div className="flex-1 text-center sm:text-left space-y-2">
            <div>
              <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                Foto de Exibição
              </h4>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Formatos aceitos: JPG, PNG, WEBP (Recomendado 400x400)
              </p>
            </div>

            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
              <label className="cursor-pointer inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold shadow-xs transition-all btn-tactile">
                <Upload className="h-3.5 w-3.5" />
                <span>Escolher Nova Foto</span>
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/jpg,image/webp"
                  className="hidden"
                  onChange={handleFileChange}
                />
              </label>

              {formData.avatar && (
                <button
                  type="button"
                  onClick={handleRemoveAvatar}
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-semibold text-rose-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  <span>Remover</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Status de Acesso / RBAC Badge */}
        <div className={`p-3 rounded-xl border flex items-center justify-between ${
          isUserAdmin
            ? 'bg-amber-50/60 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900/60 text-amber-800 dark:text-gold-300'
            : 'bg-brand-50/60 dark:bg-brand-950/20 border-brand-200 dark:border-brand-900/60 text-brand-800 dark:text-brand-300'
        }`}>
          <div className="flex items-center gap-2">
            <Shield className="h-4 w-4 shrink-0 text-gold-500" />
            <div>
              <div className="text-xs font-bold">
                {isUserAdmin ? 'Perfil: Sócia Administradora' : 'Perfil: Advogado(a) / Colaborador'}
              </div>
              <div className="text-[10px] opacity-80">
                {isUserAdmin
                  ? 'Acesso pleno a todas as abas, finanças, governança e equipe'
                  : 'Acesso operacional aos processos, atendimentos, prazos e clientes'}
              </div>
            </div>
          </div>
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-white dark:bg-navy-900 shadow-2xs border border-current">
            Ativo
          </span>
        </div>

        {/* Campos de Informações Pessoais */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Nome Completo *
            </label>
            <div className="relative">
              <User className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Dra. Helena Prado"
                className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-navy-950 pl-10 pr-3.5 py-2 text-xs text-slate-900 dark:text-white focus:border-brand-500 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              E-mail Corporativo *
            </label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="nome@escritorio.adv.br"
                className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-navy-950 pl-10 pr-3.5 py-2 text-xs text-slate-900 dark:text-white focus:border-brand-500 focus:outline-none"
              />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Telefone / WhatsApp
            </label>
            <div className="relative">
              <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                type="text"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="(11) 98888-0000"
                className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-navy-950 pl-10 pr-3.5 py-2 text-xs text-slate-900 dark:text-white focus:border-brand-500 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Inscrição na OAB
            </label>
            <div className="relative">
              <Scale className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                type="text"
                value={formData.oab}
                onChange={(e) => setFormData({ ...formData, oab: e.target.value })}
                placeholder="OAB/SP 123.456"
                className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-navy-950 pl-10 pr-3.5 py-2 text-xs text-slate-900 dark:text-white focus:border-brand-500 focus:outline-none"
              />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Cargo / Título Profissional
            </label>
            <div className="relative">
              <Briefcase className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Sócia Administradora • Advogada"
                className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-navy-950 pl-10 pr-3.5 py-2 text-xs text-slate-900 dark:text-white focus:border-brand-500 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Banca / Escritório
            </label>
            <div className="relative">
              <Building2 className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                type="text"
                value={formData.firmName}
                onChange={(e) => setFormData({ ...formData, firmName: e.target.value })}
                placeholder="Silva & Advogados Associados"
                className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-navy-950 pl-10 pr-3.5 py-2 text-xs text-slate-900 dark:text-white focus:border-brand-500 focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* Rodapé & Botões de Ação */}
        <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200 dark:border-slate-800">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-slate-300 dark:border-slate-700 px-4 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
          >
            Cancelar
          </button>

          <button
            type="submit"
            disabled={isSaving}
            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-brand-600 to-brand-700 px-5 py-2 text-xs font-bold text-white shadow-md hover:from-brand-500 hover:to-brand-600 transition-all disabled:opacity-50 btn-tactile"
          >
            {isSaving ? (
              <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                <Save className="h-4 w-4" />
                <span>Salvar Alterações</span>
              </>
            )}
          </button>
        </div>
      </form>
    </Modal>
  );
}
