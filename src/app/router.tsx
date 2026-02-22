import { createBrowserRouter } from 'react-router-dom';
import { CommandPalette } from '@/components/layout/command-palette';
import { AppShell } from '@/components/layout/app-shell';
import { SchedulePage } from '@/pages/agenda/schedule-page';
import { ClinicsPage } from '@/pages/clinicas/clinics-page';
import { SettingsPage } from '@/pages/configuracoes/settings-page';
import { DashboardPage } from '@/pages/dashboard-page';
import { ScoresPage } from '@/pages/escores/scores-page';
import { ExamsPage } from '@/pages/exames/exams-page';
import { BioimpedancePage } from '@/pages/bioimpedance-page';
import { NewConsultationPage } from '@/pages/new-consultation-page';
import { PatientProfilePage } from '@/pages/patient-profile-page';
import { PatientsListPage } from '@/pages/patients-list-page';
import { ProtocolsPage } from '@/pages/protocolos/protocols-page';
import { TemplateBuilderPage } from '@/pages/template-builder-page';
import { TemplatesPage } from '@/pages/templates/templates-page';

const ShellWithPalette = () => (
  <>
    <AppShell />
    <CommandPalette />
  </>
);

export const router = createBrowserRouter([
  {
    path: '/',
    element: <ShellWithPalette />,
    children: [
      { index: true, element: <DashboardPage /> },
      { path: 'pacientes', element: <PatientsListPage /> },
      { path: 'pacientes/:patientId', element: <PatientProfilePage /> },
      { path: 'consultas/nova', element: <NewConsultationPage /> },
      { path: 'bioimpedancia', element: <BioimpedancePage /> },
      { path: 'exames', element: <ExamsPage /> },
      { path: 'protocolos', element: <ProtocolsPage /> },
      { path: 'escores', element: <ScoresPage /> },
      { path: 'agenda', element: <SchedulePage /> },
      { path: 'clinicas', element: <ClinicsPage /> },
      { path: 'configuracoes', element: <SettingsPage /> },
      { path: 'templates', element: <TemplatesPage /> },
      { path: 'templates/builder', element: <TemplateBuilderPage /> },
    ],
  },
]);
