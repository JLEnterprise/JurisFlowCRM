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
    <div className="flex flex-col items-center justify-center min-h-[400px] p-6 text-center animate-fade-in">
      <div className="rounded-3xl bg-white dark:bg-navy-900 border border-slate-200/80 dark:border-slate-800 p-8 shadow-sm max-w-md w-full space-y-4">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-500">
          <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
        </div>
        <h3 className="text-base font-bold text-slate-900 dark:text-white">Acesso Restrito ao Módulo</h3>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          O módulo <strong>{moduleName}</strong> está configurado exclusivamente para: <em>{allowedRolesDesc}</em>.
        </p>
        <div className="pt-2">
          <button
            onClick={() => handleNavigate('dashboard')}
            className="rounded-xl bg-brand-600 px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-brand-700 transition-colors"
          >
            Voltar ao Dashboard
          </button>
        </div>
      </div>
    </div>
  );

  // Render content based on currentTab
  const renderContent = () => {
    switch (currentTab) {
      case 'dashboard':
        return (
          <div className="space-y-6">
            <DashboardStats onNavigate={handleNavigate} />
            <DashboardCharts />
          </div>
        );

      case 'kanban':
        return (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                  Funil Comercial Jurídico (Kanban)
                </h1>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Arraste os cards entre os estágios para gerenciar as negociações do escritório.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleNavigate('leads')}
                  className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-navy-900 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors shadow-sm"
                >
                  Visualização em Lista
                </button>
              </div>
            </div>

            <KanbanBoard
              onOpenNewLead={handleOpenNewLead}
              onEditLead={handleEditLead}
              onCloseContract={handleCloseContractFromLead}
            />
          </div>
        );

      case 'leads':
        return (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                  Lista de Leads & Oportunidades
                </h1>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Visão em tabela analítica de todos os potenciais clientes com filtros avançados.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleNavigate('kanban')}
                  className="px-3 py-1.5 rounded-lg bg-brand-600 text-white shadow-sm transition-colors text-xs font-bold"
                >
                  Visualização em Funil (Kanban)
                </button>
              </div>
            </div>

            <LeadList
              onOpenNewLead={handleOpenNewLead}
              onEditLead={handleEditLead}
              onCloseContract={handleCloseContractFromLead}
              onOpenTask={(lead) => handleOpenNewTask({ title: `Follow-up com ${lead.name}`, leadId: lead.id })}
              onOpenAttendance={(lead) => handleOpenNewAttendance({ clientId: lead.id, clientName: lead.name })}
            />
          </div>
        );

      case 'clients':
        if (selectedClientId) {
          return (
            <ClientDetail
              clientId={selectedClientId}
              onBack={() => setSelectedClientId(null)}
              onEditClient={handleEditClient}
              onOpenNewContract={handleOpenNewContract}
              onOpenNewProcess={(client) => handleOpenNewProcess({ clientId: client.id, clientName: client.name })}
              onOpenNewTask={(client) => handleOpenNewTask({ title: `Contato com ${client.name}`, clientId: client.id })}
              onOpenNewAttendance={(client) => handleOpenNewAttendance({ clientId: client.id, clientName: client.name })}
              onOpenNewProposal={(client) => handleOpenNewProposal({ clientId: client.id, clientName: client.name })}
            />
          );
        }
        return (
          <ClientList
            onOpenNewClient={handleOpenNewClient}
            onSelectClient={handleViewClientDetail}
            onEditClient={handleEditClient}
          />
        );

      case 'contracts':
        if (selectedContractId) {
          return (
            <ContractDetail
              contractId={selectedContractId}
              onBack={() => setSelectedContractId(null)}
              onEditContract={handleEditContract}
            />
          );
        }
        return (
          <ContractList
            onOpenNewContract={handleOpenNewContract}
            onSelectContract={handleViewContractDetail}
            onEditContract={handleEditContract}
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
          />
        );

      case 'tasks':
        return (
          <TaskList
            onOpenNewTask={handleOpenNewTask}
            onEditTask={handleEditTask}
          />
        );

      case 'documents':
        return <DocumentManager />;

      case 'financial':
        if (!permissions?.canAccessFinancial) {
          return renderAccessRestricted('Financeiro & Honorários Globais', 'Sócia Administradora, Controller Financeiro e Dev');
        }
        return <FinancialOverview />;

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
      />

      {/* Main Workspace */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Header */}
        <Header
          onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
          onOpenSearch={() => setIsSearchOpen(true)}
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
        onNavigate={(tab, id) => {
          handleNavigate(tab);
          if (tab === 'clients') setSelectedClientId(id);
          if (tab === 'contracts') setSelectedContractId(id);
          setIsSearchOpen(false);
        }}
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

      {/* Toast Notification Container */}
      <Toast toast={toast} onClose={hideToast} />
    </div>
  );
}
