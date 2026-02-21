
import React, { useState, useEffect } from 'react';
import DashboardView from './components/DashboardView';
import PatientsView from './components/PatientsView';
import AgendaView from './components/AgendaView';
import ConsultationManager from './components/ConsultationManager';
import PatientProfileView from './components/PatientProfileView';
import ProtocolLibrary from './components/ProtocolLibrary';
import ScoresView from './components/ScoresView';
import ServicesView from './components/ServicesView';
import TemplateBuilder from './components/TemplateBuilder';
import ConsultationTemplateBuilder from './components/ConsultationTemplateBuilder';
import BioimpedanceManager from './components/BioimpedanceManager';
import ClinicsView from './components/ClinicsView';
import PatientForm from './components/PatientForm';
import PublicRegistration from './components/PublicRegistration';
import AppointmentDrawer from './components/AppointmentDrawer'; 
import LoginScreen from './components/LoginScreen'; // New Import
import { PatientRecord, Appointment, AppointmentStatus, UserProfile } from './types';
import { subscribeToPatients, subscribeToAppointments, savePatient, updateAppointmentStatus, getDbStatus, deleteConsultationDraft } from './services/dbService';
import { getCurrentUser, logout } from './services/authService'; // New Import
import { analyzeDayOptimization } from './services/agendaIntelligence';
import { DEFAULT_RECORD_TEMPLATE } from './constants';
import { performSignature } from './services/integraIcpService';
import { generateDocumentHash } from './services/cryptoService';

// Window Interface
interface WindowState {
  id: string;
  type: 'DASHBOARD' | 'PATIENTS' | 'AGENDA' | 'CONSULTATION' | 'PROFILE' | 'PROTOCOLS' | 'SCORES' | 'SERVICES' | 'CLINICS' | 'TEMPLATES' | 'CONSULTATION_TEMPLATES' | 'BIOIMPEDANCE';
  title: string;
  data?: any;
  draftData?: PatientRecord; 
}

const App: React.FC = () => {
  // --- PUBLIC ROUTE CHECK ---
  const urlParams = new URLSearchParams(window.location.search);
  const isPublicRegister = urlParams.get('mode') === 'register' || urlParams.get('mode') === 'secretary';

  // --- AUTH STATE ---
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [authChecked, setAuthChecked] = useState(false);

  // State
  const [windows, setWindows] = useState<WindowState[]>([
    { id: 'dashboard', type: 'DASHBOARD', title: 'Dashboard' }
  ]);
  const [activeWindowId, setActiveWindowId] = useState<string>('dashboard');
  
  const [patients, setPatients] = useState<PatientRecord[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [showPatientForm, setShowPatientForm] = useState(false);
  const [editingPatient, setEditingPatient] = useState<PatientRecord | undefined>(undefined);
  
  // Appointment Drawer State
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);

  // Check Auth on Mount
  useEffect(() => {
      const user = getCurrentUser();
      if (user) setCurrentUser(user);
      setAuthChecked(true);
  }, []);

  // Subscriptions (Only if logged in)
  useEffect(() => {
    if (!currentUser && !isPublicRegister) return;

    const unsubPatients = subscribeToPatients(setPatients);
    const unsubAppointments = subscribeToAppointments(setAppointments);
    return () => { unsubPatients(); unsubAppointments(); };
  }, [currentUser, isPublicRegister]);

  // ... (Integra ICP Callback Effect - Same as before)
  useEffect(() => {
      const checkCallback = async () => {
          const urlParams = new URLSearchParams(window.location.search);
          const credentialCode = urlParams.get('code');
          if (credentialCode) {
              window.history.replaceState({}, document.title, window.location.pathname);
              const pendingOpStr = localStorage.getItem('integra_pending_op');
              if (!pendingOpStr) return;
              const pendingOp = JSON.parse(pendingOpStr);
              localStorage.removeItem('integra_pending_op');
              if (pendingOp.type === 'SIGN_CONSULTATION') {
                  setIsSaving(true);
                  try {
                      const content = {
                          soap: pendingOp.snapshot.soap,
                          anamnese: pendingOp.snapshot.anamnese,
                          physical: pendingOp.snapshot.physical,
                          diagnosis: pendingOp.snapshot.soap?.a?.diagnosis
                      };
                      const hash = await generateDocumentHash(content);
                      await performSignature(credentialCode, hash);
                      await handleFinishConsultation(pendingOp.snapshot, 'auto_restored', true); 
                      alert("Assinatura Cloud realizada com sucesso!");
                  } catch (e) {
                      console.error(e);
                      alert("Falha na assinatura digital via nuvem.");
                  } finally {
                      setIsSaving(false);
                  }
              }
          }
      };
      checkCallback();
  }, []);

  // --- RENDER LOGIC START ---

  // 1. If Public Route (Patient/Secretary Form), show immediately regardless of auth
  if (isPublicRegister) return <PublicRegistration />;

  // 2. If Auth not checked yet, show nothing (or spinner)
  if (!authChecked) return null;

  // 3. If Not Logged In, Show Login Screen
  if (!currentUser) {
      return <LoginScreen onLoginSuccess={() => setCurrentUser(getCurrentUser())} />;
  }

  // 4. Main App Logic (If Logged In)
  const metrics = analyzeDayOptimization(appointments);
  const openConsultations = appointments.filter(a => a.status === AppointmentStatus.IN_PROGRESS).length;
  const draftDocuments = patients.reduce((acc, p) => acc + (p.documents?.filter(d => d.versions[0].status === 'DRAFT').length || 0), 0);
  const totalAlerts = openConsultations + draftDocuments;

  const openWindow = (type: WindowState['type'], data?: any, title?: string) => {
    const existing = windows.find(w => w.type === type && (data?.id ? w.data?.id === data.id : true));
    if (existing) {
      setActiveWindowId(existing.id);
      return;
    }
    const newWindow: WindowState = { id: crypto.randomUUID(), type, title: title || type, data };
    setWindows([...windows, newWindow]);
    setActiveWindowId(newWindow.id);
  };

  const closeWindow = async (e: React.MouseEvent | any, id: string) => {
      if (e && typeof e.stopPropagation === 'function') e.stopPropagation();
      if (id === 'dashboard') return; 
      
      const win = windows.find(w => w.id === id);
      if (win?.type === 'CONSULTATION' && win.draftData && win.draftData.id) {
          setIsSaving(true);
          await savePatient(win.draftData);
          setIsSaving(false);
      }

      const newWindows = windows.filter(w => w.id !== id);
      setWindows(newWindows);
      if (activeWindowId === id) setActiveWindowId(newWindows[newWindows.length - 1].id);
  };

  const handleSavePatient = async (profile: any) => {
      setIsSaving(true);
      try {
          const record = editingPatient || { ...DEFAULT_RECORD_TEMPLATE, id: crypto.randomUUID() };
          const updated = { ...record, profile: { ...record.profile, ...profile } };
          await savePatient(updated);
          setShowPatientForm(false);
          setEditingPatient(undefined);
      } catch (e) {
          console.error(e);
          alert('Erro ao salvar paciente');
      } finally {
          setIsSaving(false);
      }
  };

  const handleUpdatePatient = async (patient: PatientRecord) => {
      await savePatient(patient);
  };

  const handleFinishConsultation = async (patient: PatientRecord, windowId: string, skipWindowClose: boolean = false) => {
      setIsSaving(true);
      try {
          const newEvent = {
              id: crypto.randomUUID(),
              date: new Date().toISOString(),
              type: 'appointment' as const,
              title: 'Consulta Realizada',
              description: `Queixa: ${patient.anamnese?.queixas || 'N/A'} | Diagnóstico: ${patient.soap?.a?.diagnosis || 'N/A'}`,
              signed: true
          };

          const updatedTimeline = [...(patient.timeline || []), newEvent];
          const finalPatient = { 
              ...patient, 
              timeline: updatedTimeline,
              profile: { ...patient.profile, lastConsultationAt: new Date().toISOString() },
              soap: DEFAULT_RECORD_TEMPLATE.soap,
              anamnese: DEFAULT_RECORD_TEMPLATE.anamnese,
              physical: { ...DEFAULT_RECORD_TEMPLATE.physical, altura: patient.physical.altura } 
          };
          
          await savePatient(finalPatient);

          const activeAppt = appointments.find(a => a.patientId === patient.id && a.status === AppointmentStatus.IN_PROGRESS);
          if (activeAppt) {
              await updateAppointmentStatus(activeAppt.id, AppointmentStatus.COMPLETED);
          }

          deleteConsultationDraft(patient.id);

          if (!skipWindowClose && windowId !== 'auto_restored') {
              closeWindow(null, windowId);
          }
      } catch (e) {
          console.error("Error finishing consultation", e);
          alert("Erro ao finalizar consulta.");
      } finally {
          setIsSaving(false);
      }
  };

  const renderWindowContent = (win: WindowState) => {
      switch (win.type) {
          case 'DASHBOARD': return <DashboardView userName={currentUser.name} specialty={currentUser.specialty || "Médico"} appointments={appointments} metrics={metrics} onNavigateToAgenda={(filter) => openWindow('AGENDA', { filter }, 'Agenda')} onNavigateToConsultation={(pid, name) => { const p = patients.find(pat => pat.id === pid); if (p) openWindow('CONSULTATION', p, `Consulta: ${name}`); }} />;
          case 'PATIENTS': return <PatientsView patients={patients} onOpenPatient={(id) => { const p = patients.find(pat => pat.id === id); if (p) openWindow('PROFILE', p, p.profile.fullName); }} onOpenConsultation={(id, name) => { const p = patients.find(pat => pat.id === id); if (p) openWindow('CONSULTATION', p, `Consulta: ${name}`); }} onNewPatient={() => { setEditingPatient(undefined); setShowPatientForm(true); }} />;
          case 'AGENDA': return <AgendaView appointments={appointments} onUpdateStatus={updateAppointmentStatus} onSelectAppointment={setSelectedAppointment} onNewAppointment={(prefill) => alert("Agendamento em desenvolvimento")} />;
          case 'CONSULTATION': return <ConsultationManager patient={patients.find(p => p.id === win.data.id) || win.data} consultationDuration={0} onUpdatePatient={(updated) => { setWindows(prev => prev.map(w => w.id === win.id ? { ...w, draftData: updated } : w)); handleUpdatePatient(updated); }} onFinish={() => handleFinishConsultation(win.data, win.id)} />;
          case 'PROFILE': return <PatientProfileView patient={patients.find(p => p.id === win.data.id) || win.data} appointments={appointments} onStartConsultation={() => openWindow('CONSULTATION', win.data, `Consulta: ${win.data.profile.fullName}`)} onClose={(e) => closeWindow(e, win.id)} onUpdatePatient={handleUpdatePatient} onSelectAppointment={setSelectedAppointment} />;
          case 'PROTOCOLS': return <ProtocolLibrary protocols={[]} onRefresh={() => {}} onOpenIngest={() => alert('Ingestão em breve')} />;
          case 'SCORES': return <ScoresView />;
          case 'SERVICES': return <ServicesView onClose={() => closeWindow(null, win.id)} />;
          case 'CLINICS': return <ClinicsView onClose={() => closeWindow(null, win.id)} />;
          case 'TEMPLATES': return <TemplateBuilder onClose={() => closeWindow(null, win.id)} />;
          case 'CONSULTATION_TEMPLATES': return <ConsultationTemplateBuilder onClose={() => closeWindow(null, win.id)} />;
          case 'BIOIMPEDANCE': return <BioimpedanceManager onClose={() => closeWindow(null, win.id)} />;
          default: return <div>Janela desconhecida</div>;
      }
  };

  return (
    <div className="flex h-screen w-screen bg-slate-100 overflow-hidden font-sans text-slate-900 flex-col">
      
      {totalAlerts > 0 && (
          <div className="bg-rose-800 text-white px-4 py-2 flex items-center justify-between text-xs font-bold animate-in slide-in-from-top z-[60] shadow-md">
              <div className="flex items-center gap-2">
                  <div className="bg-white/20 p-1 rounded"><i className="fa-solid fa-clipboard-list"></i></div>
                  <span>Existem Atendimentos ou Documentos não finalizados!</span>
              </div>
              <div className="flex gap-4">
                  {openConsultations > 0 && <span>{openConsultations} Consultas Abertas</span>}
                  {draftDocuments > 0 && <span>{draftDocuments} Documentos em Rascunho</span>}
              </div>
          </div>
      )}

      <div className="flex flex-1 overflow-hidden">
          {/* SIDEBAR */}
          <aside className="w-20 bg-slate-900 flex flex-col items-center py-6 gap-6 z-50 shadow-xl no-print">
              <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white font-black text-xl mb-4 shadow-lg shadow-indigo-900/50">
                  <i className="fa-solid fa-staff-snake"></i>
              </div>
              
              <nav className="flex flex-col gap-4 w-full px-2 items-center">
                  <NavIcon icon="fa-chart-pie" active={activeWindowId === 'dashboard'} onClick={() => { const dash = windows.find(w => w.type === 'DASHBOARD'); if (dash) setActiveWindowId(dash.id); else openWindow('DASHBOARD'); }} tooltip="Dashboard" />
                  <NavIcon icon="fa-users" onClick={() => openWindow('PATIENTS', null, 'Pacientes')} tooltip="Pacientes" />
                  <NavIcon icon="fa-weight-scale" onClick={() => openWindow('BIOIMPEDANCE', null, 'Bioimpedância')} tooltip="Bioimpedância" />
                  
                  <div className="h-px w-8 bg-slate-700 mx-auto my-2"></div>
                  
                  <NavGroup icon="fa-microscope" tooltip="Módulo Científico">
                      <NavSubItem icon="fa-book-medical" label="Protocolos" onClick={() => openWindow('PROTOCOLS', null, 'Protocolos')} />
                      <NavSubItem icon="fa-calculator" label="Escores" onClick={() => openWindow('SCORES', null, 'Escores')} />
                  </NavGroup>

                  <NavGroup icon="fa-briefcase-medical" tooltip="Operacional">
                      <NavSubItem icon="fa-calendar-days" label="Agenda" onClick={() => openWindow('AGENDA', null, 'Agenda')} />
                      <NavSubItem icon="fa-tags" label="Serviços" onClick={() => openWindow('SERVICES', null, 'Serviços')} />
                      <NavSubItem icon="fa-hospital" label="Clínicas" onClick={() => openWindow('CLINICS', null, 'Clínicas')} />
                  </NavGroup>

                  <NavGroup icon="fa-file-pen" tooltip="Editor de Templates">
                      <NavSubItem icon="fa-file-signature" label="Documentos" onClick={() => openWindow('TEMPLATES', null, 'Templates Docs')} />
                      <NavSubItem icon="fa-clipboard-list" label="Consultas" onClick={() => openWindow('CONSULTATION_TEMPLATES', null, 'Templates Consulta')} />
                  </NavGroup>
              </nav>

              <div className="mt-auto flex flex-col gap-4 mb-4">
                  <button onClick={logout} className="w-10 h-10 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-400 hover:text-rose-500 hover:bg-slate-700 transition" title="Sair">
                      <i className="fa-solid fa-right-from-bracket"></i>
                  </button>
                  <div className={`w-3 h-3 rounded-full ${getDbStatus().includes('CLOUD') ? 'bg-emerald-500' : 'bg-amber-500'} border-2 border-slate-900 mx-auto`} title={`Database: ${getDbStatus()}`}></div>
              </div>
          </aside>

          {/* Main Area */}
          <main className="flex-1 flex flex-col relative overflow-hidden">
              <div className="bg-slate-200/80 backdrop-blur px-4 pt-2 flex gap-2 overflow-x-auto no-scrollbar border-b border-slate-300/50 no-print">
                  {windows.map(win => (
                      <div 
                          key={win.id}
                          onClick={() => setActiveWindowId(win.id)}
                          className={`group relative pl-4 pr-10 py-2.5 rounded-t-xl text-xs font-bold uppercase tracking-wide cursor-pointer transition-all select-none flex items-center gap-2 min-w-[150px] max-w-[240px] ${activeWindowId === win.id ? 'bg-white text-indigo-700 shadow-sm z-10 translate-y-[1px]' : 'bg-slate-300/50 text-slate-500 hover:bg-slate-300 hover:text-slate-700'}`}
                      >
                          <i className={`fa-solid ${getIconForType(win.type)} opacity-70`}></i>
                          <span className="truncate">{win.title}</span>
                          {win.id !== 'dashboard' && <button onClick={(e) => closeWindow(e, win.id)} className="absolute right-2 top-1/2 -translate-y-1/2 w-5 h-5 rounded-md flex items-center justify-center hover:bg-rose-500 hover:text-white text-slate-400 transition"><i className="fa-solid fa-xmark"></i></button>}
                      </div>
                  ))}
              </div>
              <div className="flex-1 relative bg-white shadow-inner overflow-hidden">
                  {windows.map(win => (
                      <div key={win.id} className={`absolute inset-0 transition-opacity duration-200 ${activeWindowId === win.id ? 'opacity-100 z-10 pointer-events-auto' : 'opacity-0 z-0 pointer-events-none'}`}>
                          <div className="h-full w-full overflow-hidden">{renderWindowContent(win)}</div>
                      </div>
                  ))}
              </div>
          </main>
      </div>

      {showPatientForm && <PatientForm initialData={editingPatient} onSave={handleSavePatient} onCancel={() => setShowPatientForm(false)} />}
      
      {/* GLOBAL APPOINTMENT DRAWER */}
      <AppointmentDrawer 
          isOpen={!!selectedAppointment}
          appointment={selectedAppointment}
          onClose={() => setSelectedAppointment(null)}
          onEdit={(appt) => { alert('Editar em desenvolvimento'); }}
          onStartConsultation={(appt) => { 
              const p = patients.find(pat => pat.id === appt.patientId); 
              if (p) {
                  openWindow('CONSULTATION', p, `Consulta: ${p.profile.fullName}`);
                  setSelectedAppointment(null);
                  updateAppointmentStatus(appt.id, AppointmentStatus.IN_PROGRESS);
              }
          }}
          onUpdateStatus={updateAppointmentStatus}
          onCancelAppointment={(id) => updateAppointmentStatus(id, AppointmentStatus.CANCELED)}
      />
    </div>
  );
};

const NavIcon = ({ icon, onClick, active, tooltip }: any) => (
    <button onClick={onClick} className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg transition relative group ${active ? 'bg-white text-indigo-600 shadow-lg' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`} title={tooltip}>
        <i className={`fa-solid ${icon}`}></i>
        <div className="absolute left-full top-1/2 -translate-y-1/2 ml-3 px-2 py-1 bg-slate-800 text-white text-[10px] font-bold rounded opacity-0 group-hover:opacity-100 transition pointer-events-none whitespace-nowrap z-50">{tooltip}</div>
    </button>
);

const NavGroup = ({ icon, tooltip, children }: any) => {
    const [open, setOpen] = useState(false);
    return (
        <div className="relative group w-full flex justify-center" onMouseEnter={() => setOpen(true)} onMouseLeave={() => setOpen(false)}>
            <button className="w-10 h-10 rounded-xl flex items-center justify-center text-lg text-slate-400 hover:bg-slate-800 hover:text-white transition">
                <i className={`fa-solid ${icon}`}></i>
            </button>
            {open && (
                <div className="absolute left-full top-0 ml-2 bg-slate-800 rounded-xl p-2 min-w-[160px] shadow-xl z-[9999] flex flex-col gap-1 border border-slate-700 animate-in fade-in slide-in-from-left-2">
                    <div className="text-[9px] font-black text-slate-500 uppercase px-2 mb-1">{tooltip}</div>
                    {children}
                </div>
            )}
        </div>
    );
};

const NavSubItem = ({ icon, label, onClick }: any) => (
    <button onClick={(e) => { e.stopPropagation(); onClick(); }} className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-indigo-600 text-slate-300 hover:text-white transition text-left w-full group/item">
        <i className={`fa-solid ${icon} w-4 text-center group-hover/item:text-white`}></i>
        <span className="text-xs font-bold">{label}</span>
    </button>
);

const getIconForType = (type: string) => {
    switch (type) {
        case 'DASHBOARD': return 'fa-chart-pie';
        case 'PATIENTS': return 'fa-users';
        case 'AGENDA': return 'fa-calendar-days';
        case 'CONSULTATION': return 'fa-stethoscope';
        case 'PROFILE': return 'fa-id-card';
        case 'PROTOCOLS': return 'fa-book-medical';
        case 'SCORES': return 'fa-calculator';
        case 'SERVICES': return 'fa-tags';
        case 'CLINICS': return 'fa-hospital';
        case 'TEMPLATES': return 'fa-file-signature';
        case 'CONSULTATION_TEMPLATES': return 'fa-clipboard-list';
        case 'BIOIMPEDANCE': return 'fa-weight-scale';
        default: return 'fa-window-maximize';
    }
};

export default App;
