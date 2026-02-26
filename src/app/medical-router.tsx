import { createBrowserRouter, Navigate } from 'react-router-dom';
import { AuthGuard } from '@/components/layout/auth-guard';
import { AppShell } from '@/components/layout/app-shell';
import { MedicalShell } from '@/components/layout/medical-shell';
import { BioimpedancePage } from '@/pages/bioimpedance-page';
import { DashboardPage } from '@/pages/dashboard-page';
import { MedicalLoginPage } from '@/pages/medical-login-page';
import { NewConsultationPage } from '@/pages/new-consultation-page';
import { PatientProfilePage } from '@/pages/patient-profile-page';
import { PatientsListPage } from '@/pages/patients-list-page';
import { TemplateBuilderPage } from '@/pages/template-builder-page';
import { SchedulePage } from '@/pages/agenda/schedule-page';
import { ClinicsPage } from '@/pages/clinicas/clinics-page';
import { SettingsPage } from '@/pages/configuracoes/settings-page';
import { ScoresPage } from '@/pages/escores/scores-page';
import { ExamsPage } from '@/pages/exames/exams-page';
import { DocumentsPage } from '@/pages/patient/documents-page';
import { ExamsUploadPage } from '@/pages/patient/exams-upload-page';
import { GlucosePage } from '@/pages/patient/glucose-page';
import { HomePage } from '@/pages/patient/home-page';
import { LoginPage } from '@/pages/patient/login-page';
import { ProfilePage } from '@/pages/patient/profile-page';
import { QuestionnairePage } from '@/pages/patient/questionnaire-page';
import { ProtocolsPage } from '@/pages/protocolos/protocols-page';
import { TemplatesPage } from '@/pages/templates/templates-page';

export const medicalRouter = createBrowserRouter([
  { path: '/app', element: <Navigate to="/" replace /> },
  { path: '/app/*', element: <Navigate to="/" replace /> },
  { path: '/login', element: <MedicalLoginPage /> },
  {
    path: '/',
    element: <AuthGuard />,
    children: [
      {
        path: '/',
        element: <MedicalShell />,
        children: [
          { index: true, element: <DashboardPage /> },
          { path: 'pacientes', element: <PatientsListPage /> },
          { path: 'pacientes/:patientId', element: <PatientProfilePage /> },
          { path: 'consultas/nova', element: <NewConsultationPage /> },
          { path: 'bioimpedancia', element: <BioimpedancePage /> },
          { path: 'agenda', element: <SchedulePage /> },
          { path: 'clinicas', element: <ClinicsPage /> },
          { path: 'configuracoes', element: <SettingsPage /> },
          { path: 'escores', element: <ScoresPage /> },
          { path: 'exames', element: <ExamsPage /> },
          { path: 'protocolos', element: <ProtocolsPage /> },
          { path: 'templates', element: <TemplatesPage /> },
          { path: 'templates/builder', element: <TemplateBuilderPage /> },
        ],
      },
    ],
  },
  {
    path: '/paciente',
    element: <AppShell />,
    children: [
      { index: true, element: <HomePage /> },
      { path: 'login', element: <LoginPage /> },
      { path: 'glicemia', element: <GlucosePage /> },
      { path: 'exames', element: <ExamsUploadPage /> },
      { path: 'documentos', element: <DocumentsPage /> },
      { path: 'questionario', element: <QuestionnairePage /> },
      { path: 'perfil', element: <ProfilePage /> },
    ],
  },
]);
