import { createBrowserRouter } from 'react-router-dom';
import { AuthGuard } from '@/components/layout/auth-guard';
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
import { ProtocolsPage } from '@/pages/protocolos/protocols-page';
import { TemplatesPage } from '@/pages/templates/templates-page';

export const medicalRouter = createBrowserRouter(
  [
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
  ],
  { basename: '/app' },
);
