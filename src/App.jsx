import React, { useState } from 'react';
import { useAuth } from './context/AuthContext';
import { useCRM } from './context/CRMContext';
import { Sidebar } from './components/layout/Sidebar';
import { Header } from './components/layout/Header';
import { GlobalSearchModal } from './components/layout/GlobalSearchModal';
import { Toast } from './components/common/Toast';
import { LoginView } from './components/auth/LoginView';
import { ErrorBoundary } from './components/common/ErrorBoundary';

// Modules
import { DashboardStats } from './components/dashboard/DashboardStats';
import { DashboardCharts } from './components/dashboard/DashboardCharts';
import { KanbanBoard } from './components/leads/KanbanBoard';
import { LeadList } from './components/leads/LeadList';
import { LeadModal } from './components/leads/LeadModal';

import { ClientList } from './components/clients/ClientList';
import { ClientDetail } from './components/clients/ClientDetail';
import { ClientModal } from './components/clients/ClientModal';

import { ContractList } from './components/contracts/ContractList';
import { ContractDetail } from './components/contracts/ContractDetail';
import { ContractModal } from './components/contracts/ContractModal';
import { CloseContractModal } from './components/contracts/CloseContractModal';
import { SignatureModal } from './components/contracts/SignatureModal';

import { ProposalList } from './components/proposals/ProposalList';
import { ProposalModal } from './components/proposals/ProposalModal';

import { ProcessList } from './components/processes/ProcessList';
import { ProcessModal } from './components/processes/ProcessModal';

import { AttendanceList } from './components/attendance/AttendanceList';
import { AttendanceModal } from './components/attendance/AttendanceModal';

import { CalendarView } from './components/agenda/CalendarView';
import { EventModal } from './components/agenda/EventModal';

import { TaskList } from './components/tasks/TaskList';
import { TaskModal } from './components/tasks/TaskModal';

import { DocumentManager } from './components/documents/DocumentManager';
import { FinancialOverview } from './components/financial/FinancialOverview';
import { ReportsView } from './components/reports/ReportsView';
import { TeamView } from './components/team/TeamView';
import { ActivityLogsView } from './components/security/ActivityLogsView';
import { SettingsView } from './components/settings/SettingsView';

// Enterprise Power-Ups
import { LegalCopilotModal } from './components/ai/LegalCopilotModal';
import { WhatsAppModal } from './components/whatsapp/WhatsAppModal';

export function App() {
  const { isAuthenticated, currentUser, permissions } = useAuth();
  const { toast, hideToast } = useCRM();

  // Navigation state
  const [currentTab, setCurrentTab] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  // Selected Detail Views
  const [selectedClientId, setSelectedClientId] = useState(null);
  const [selectedContractId, setSelectedContractId] = useState(null);

  // Lead view mode (kanban vs list)
  const [leadViewMode, setLeadViewMode] = useState('kanban');

  // Modals state
  const [leadModalOpen, setLeadModalOpen] = useState(false);
  const [leadToEdit, setLeadToEdit] = useState(null);

  const [clientModalOpen, setClientModalOpen] = useState(false);
  const [clientToEdit, setClientToEdit] = useState(null);

  const [contractModalOpen, setContractModalOpen] = useState(false);
  const [contractToEdit, setContractToEdit] = useState(null);

  const [closeContractModalOpen, setCloseContractModalOpen] = useState(false);
  const [leadForContractClosing, setLeadForContractClosing] = useState(null);

  const [proposalModalOpen, setProposalModalOpen] = useState(false);
  const [proposalToEdit, setProposalToEdit] = useState(null);
  const [proposalPrefill, setProposalPrefill] = useState(null);

  const [processModalOpen, setProcessModalOpen] = useState(false);
  const [processToEdit, setProcessToEdit] = useState(null);
  const [processPrefill, setProcessPrefill] = useState(null);

  const [taskModalOpen, setTaskModalOpen] = useState(false);
  const [taskToEdit, setTaskToEdit] = useState(null);
  const [taskPrefill, setTaskPrefill] = useState(null);

  const [eventModalOpen, setEventModalOpen] = useState(false);
  const [eventToEdit, setEventToEdit] = useState(null);
  const [eventDefaultDate, setEventDefaultDate] = useState(null);

  const [attendanceModalOpen, setAttendanceModalOpen] = useState(false);
  const [attendancePrefill, setAttendancePrefill] = useState(null);

  // Power-Ups Modals
  const [copilotModalOpen, setCopilotModalOpen] = useState(false);
  const [copilotInitialTab, setCopilotInitialTab] = useState('chat');

  const [whatsAppModalOpen, setWhatsAppModalOpen] = useState(false);
  const [whatsAppData, setWhatsAppData] = useState({});

  const [signatureModalOpen, setSignatureModalOpen] = useState(false);
  const [contractForSignature, setContractForSignature] = useState(null);

  // If not logged in, render Login View
  if (!isAuthenticated) {
    return (
      <>
        <LoginView />
        <Toast toast={toast} onClose={hideToast} />
      </>
    );
  }

  // Navigation Handler
  const handleNavigate = (tab) => {
    setCurrentTab(tab);
    setSelectedClientId(null);
    setSelectedContractId(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Handlers for Modals & Actions
  const handleOpenNewLead = () => {
    setLeadToEdit(null);
    setLeadModalOpen(true);
  };

  const handleEditLead = (lead) => {
    setLeadToEdit(lead);
    setLeadModalOpen(true);
  };

  const handleCloseContractFromLead = (lead) => {
    setLeadForContractClosing(lead);
    setCloseContractModalOpen(true);
  };

  const handleOpenNewClient = () => {
    setClientToEdit(null);
    setClientModalOpen(true);
  };

  const handleEditClient = (client) => {
    setClientToEdit(client);
    setClientModalOpen(true);
  };

  const handleViewClientDetail = (clientId) => {
    const id = typeof clientId === 'object' ? clientId.id : clientId;
    setSelectedClientId(id);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleOpenNewContract = (prefill) => {
    setContractToEdit(prefill || null);
    setContractModalOpen(true);
  };

  const handleEditContract = (contract) => {
    setContractToEdit(contract);
    setContractModalOpen(true);
  };

  const handleViewContractDetail = (contractOrId) => {
    const id = typeof contractOrId === 'object' ? contractOrId.id : contractOrId;
    setSelectedContractId(id);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleOpenSignatureModal = (contract) => {
    setContractForSignature(contract);
    setSignatureModalOpen(true);
  };

  const handleOpenWhatsAppModal = (data = {}) => {
    setWhatsAppData(data);
    setWhatsAppModalOpen(true);
  };

  const handleOpenCopilotModal = (tab = 'chat') => {
    setCopilotInitialTab(tab);
    setCopilotModalOpen(true);
  };

  const handleOpenNewProposal = (prefill) => {
    setProposalToEdit(null);
    setProposalPrefill(prefill || null);
    setProposalModalOpen(true);
  };

  const handleEditProposal = (proposal) => {
    setProposalToEdit(proposal);
    setProposalPrefill(null);
    setProposalModalOpen(true);
  };

  const handleConvertProposalToContract = (proposal) => {
    handleOpenNewContract({
      title: `Contrato de Honorários - ${proposal.serviceName || proposal.title || 'Serviço Jurídico'}`,
      clientId: proposal.clientId,
      clientName: proposal.clientName || proposal.leadName,
      value: proposal.value,
      legalArea: proposal.legalArea,
    });
  };

  const handleOpenNewProcess = (prefill) => {
    setProcessToEdit(null);
    setProcessPrefill(prefill || null);
    setProcessModalOpen(true);
  };

  const handleEditProcess = (process) => {
    setProcessToEdit(process);
    setProcessPrefill(null);
    setProcessModalOpen(true);
  };

  const handleOpenNewTask = (prefill) => {
    setTaskToEdit(null);
    setTaskPrefill(prefill || null);
    setTaskModalOpen(true);
  };

  const handleEditTask = (task) => {
    setTaskToEdit(task);
    setTaskPrefill(null);
    setTaskModalOpen(true);
  };

  const handleOpenNewEvent = (defaultDate, eventToEditData) => {
    setEventToEdit(eventToEditData || null);
    setEventDefaultDate(defaultDate || null);
    setEventModalOpen(true);
  };

  const handleOpenNewAttendance = (prefill) => {
    setAttendancePrefill(prefill || null);
    setAttendanceModalOpen(true);
  };

  const renderAccessRestricted = (moduleName, allowedRolesDesc) => (
    <div className="flex flex-col items-center justify-center min-h-[400px] text-center p-8 bg-white dark:bg-navy-900 rounded-3xl border border-slate-200 dark:border-white/[0.08] shadow-sm">
      <div className="h-16 w-16 rounded-2xl bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 flex items-center justify-center mb-4">
        🔒
      </div>
      <h2 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">
        Acesso Restrito ao Módulo: {moduleName}
      </h2>
      <p className="text-sm text-slate-500 dark:text-slate-400 max-w-md mt-2">
        Seu cargo atual (<strong className="text-brand-600 dark:text-gold-400">{currentUser?.role || 'Usuário'}</strong>) não possui permissão para acessar este módulo.
      </p>
      <div className="mt-4 p-3 bg-slate-50 dark:bg-navy-950 rounded-xl border border-slate-200 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-300">
        Perfis com autorização: <strong>{allowedRolesDesc}</strong>
      </div>
    </div>
  );

  // Router for Main Content
  const renderContent = () => {
    // Detail Views have priority
    if (selectedClientId && currentTab === 'clients') {
      return (
        <ClientDetail
          clientId={selectedClientId}
          onBack={() => setSelectedClientId(null)}
          onEditClient={handleEditClient}
          onOpenNewContract={handleOpenNewContract}
          onOpenNewProcess={handleOpenNewProcess}
          onOpenNewTask={handleOpenNewTask}
          onOpenNewAttendance={handleOpenNewAttendance}
        />
      );
    }

    if (selectedContractId && currentTab === 'contracts') {
      return (
        <ContractDetail
          contractId={selectedContractId}
          onBack={() => setSelectedContractId(null)}
          onEditContract={handleEditContract}
          onSignContract={handleOpenSignatureModal}
          onSendWhatsApp={handleOpenWhatsAppModal}
        />
      );
    }

    switch (currentTab) {
      case 'dashboard':
        return (
          <div className="space-y-6">
            <DashboardStats onNavigate={handleNavigate} />
            <DashboardCharts />
          </div>
        );

      case 'kanban':
      case 'leads':
        return (
          <div className="space-y-4">
            {leadViewMode === 'kanban' ? (
              <KanbanBoard
                onOpenNewLead={handleOpenNewLead}
                onEditLead={handleEditLead}
                onCloseContract={handleCloseContractFromLead}
                onToggleView={() => setLeadViewMode('list')}
                leadViewMode={leadViewMode}
              />
            ) : (
              <LeadList
                onOpenNewLead={handleOpenNewLead}
                onEditLead={handleEditLead}
                onCloseContract={handleCloseContractFromLead}
                onToggleView={() => setLeadViewMode('kanban')}
                leadViewMode={leadViewMode}
              />
            )}
          </div>
        );

      case 'clients':
        return (
          <ClientList
            onOpenNewClient={handleOpenNewClient}
            onSelectClient={handleViewClientDetail}
            onEditClient={handleEditClient}
          />
        );

      case 'contracts':
        return (
          <ContractList
            onOpenNewContract={handleOpenNewContract}
            onSelectContract={handleViewContractDetail}
            onEditContract={handleEditContract}
            onSignContract={handleOpenSignatureModal}
          />
        );

      case 'proposals':
        return (
          <ProposalList
            onOpenNewProposal={() => handleOpenNewProposal()}
            onEditProposal={handleEditProposal}
            onConvertToContract={handleConvertProposalToContract}
          />
        );

      case 'processes':
        if (!permissions?.canAccessProcesses) {
          return renderAccessRestricted('Processos Judiciais (Operação Jurídica)', 'Advogados (Sênior e Pleno), Sócia Administradora e Dev');
        }
        return (
          <ProcessList
            onOpenNewProcess={() => handleOpenNewProcess()}
            onEditProcess={handleEditProcess}
            onNavigate={handleNavigate}
            onOpenCopilot={handleOpenCopilotModal}
            onOpenWhatsApp={handleOpenWhatsAppModal}
          />
        );

      case 'attendance':
        return (
          <AttendanceList
            onOpenNewAttendance={() => handleOpenNewAttendance()}
          />
        );

      case 'agenda':
        return (
          <CalendarView
            onOpenNewEvent={handleOpenNewEvent}
            onOpenWhatsApp={handleOpenWhatsAppModal}
          />
        );

      case 'tasks':
        return (
          <TaskList
            onOpenNewTask={handleOpenNewTask}
            onEditTask={handleEditTask}
            onOpenCopilot={() => handleOpenCopilotModal('intimacoes')}
          />
        );

      case 'documents':
        return <DocumentManager />;

      case 'financial':
        if (!permissions?.canAccessFinancial) {
          return renderAccessRestricted('Financeiro & Honorários Globais', 'Sócia Administradora, Controller Financeiro e Dev');
        }
        return <FinancialOverview onOpenWhatsApp={handleOpenWhatsAppModal} />;

      case 'reports':
        return <ReportsView />;

      case 'team':
        if (!permissions?.canAccessTeam) {
          return renderAccessRestricted('Gestão de Equipe & Advogados', 'Sócia Administradora, Advogado Sênior Coordenador e Dev');
        }
        return <TeamView />;

      case 'security':
        if (!permissions?.canAccessSecurity) {
          return renderAccessRestricted('Segurança, LGPD & Banco Supabase', 'Desenvolvedor (Dev / TI) e Sócia Administradora');
        }
        return <ActivityLogsView />;

      case 'settings':
        if (!permissions?.canAccessSettings) {
          return renderAccessRestricted('Configurações do Escritório', 'Sócia Administradora & Desenvolvedor');
        }
        return <SettingsView />;

      default:
        return (
          <div className="space-y-6">
            <DashboardStats onNavigate={handleNavigate} />
            <DashboardCharts />
          </div>
        );
    }
  };

  return (
    <div className="flex h-screen bg-slate-50 dark:bg-navy-950 font-sans text-slate-900 dark:text-slate-100 overflow-hidden">
      {/* Sidebar Navigation */}
      <Sidebar
        currentTab={currentTab}
        setCurrentTab={handleNavigate}
        isOpen={sidebarOpen}
        setIsOpen={setSidebarOpen}
        onOpenCopilot={() => handleOpenCopilotModal('intimacoes')}
      />

      {/* Main Workspace */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Header */}
        <Header
          onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
          onOpenSearch={() => setIsSearchOpen(true)}
          onOpenCopilot={handleOpenCopilotModal}
          onOpenWhatsApp={handleOpenWhatsAppModal}
          currentTab={currentTab}
          onNavigate={handleNavigate}
        />

        {/* Dynamic Main Body with Smooth Scroll */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          <div className="mx-auto max-w-7xl">
            <ErrorBoundary
              key={currentTab}
              onReset={() => {
                setSelectedContractId(null);
                setSelectedClientId(null);
              }}
              onNavigateHome={() => handleNavigate('dashboard')}
            >
              {renderContent()}
            </ErrorBoundary>
          </div>
        </main>
      </div>

      {/* Global Search Modal (Ctrl+K) */}
      <GlobalSearchModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        onNavigate={handleNavigate}
        onSelectClient={handleViewClientDetail}
        onSelectContract={handleViewContractDetail}
      />

      {/* Lead Modal */}
      <LeadModal
        isOpen={leadModalOpen}
        onClose={() => setLeadModalOpen(false)}
        leadToEdit={leadToEdit}
      />

      {/* Client Modal */}
      <ClientModal
        isOpen={clientModalOpen}
        onClose={() => setClientModalOpen(false)}
        clientToEdit={clientToEdit}
      />

      {/* Contract Modal */}
      <ContractModal
        isOpen={contractModalOpen}
        onClose={() => setContractModalOpen(false)}
        contractToEdit={contractToEdit}
      />

      {/* Close Contract Modal (Workflow Lead -> Contract + Client) */}
      <CloseContractModal
        isOpen={closeContractModalOpen}
        onClose={() => setCloseContractModalOpen(false)}
        lead={leadForContractClosing}
      />

      {/* Proposal Modal */}
      <ProposalModal
        isOpen={proposalModalOpen}
        onClose={() => setProposalModalOpen(false)}
        proposalToEdit={proposalToEdit}
        prefillData={proposalPrefill}
      />

      {/* Process Modal */}
      <ProcessModal
        isOpen={processModalOpen}
        onClose={() => setProcessModalOpen(false)}
        processToEdit={processToEdit}
        prefillData={processPrefill}
      />

      {/* Task Modal */}
      <TaskModal
        isOpen={taskModalOpen}
        onClose={() => setTaskModalOpen(false)}
        taskToEdit={taskToEdit}
        prefillData={taskPrefill}
      />

      {/* Event Modal */}
      <EventModal
        isOpen={eventModalOpen}
        onClose={() => setEventModalOpen(false)}
        eventToEdit={eventToEdit}
        defaultDate={eventDefaultDate}
      />

      {/* Attendance Modal */}
      <AttendanceModal
        isOpen={attendanceModalOpen}
        onClose={() => setAttendanceModalOpen(false)}
        prefillData={attendancePrefill}
      />

      {/* POWER-UPS MODALS */}
      {/* 1. Copiloto IA Jurídica Modal */}
      <LegalCopilotModal
        isOpen={copilotModalOpen}
        onClose={() => setCopilotModalOpen(false)}
        initialTab={copilotInitialTab}
      />

      {/* 2. WhatsApp Engine Modal */}
      <WhatsAppModal
        isOpen={whatsAppModalOpen}
        onClose={() => setWhatsAppModalOpen(false)}
        initialData={whatsAppData}
      />

      {/* 3. Assinatura Eletrônica ICP Modal */}
      <SignatureModal
        isOpen={signatureModalOpen}
        onClose={() => setSignatureModalOpen(false)}
        contract={contractForSignature}
      />

      {/* Toast Notification Container */}
      <Toast toast={toast} onClose={hideToast} />
    </div>
  );
}
