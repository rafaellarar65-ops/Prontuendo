import { createBrowserRouter } from 'react-router-dom';
import { AppShell } from '@/components/layout/app-shell';
import { DocumentsPage } from '@/pages/patient/documents-page';
import { ExamsUploadPage } from '@/pages/patient/exams-upload-page';
import { GlucosePage } from '@/pages/patient/glucose-page';
import { HomePage } from '@/pages/patient/home-page';
import { LoginPage } from '@/pages/patient/login-page';
import { ProfilePage } from '@/pages/patient/profile-page';
import { QuestionnairePage } from '@/pages/patient/questionnaire-page';

export const router = createBrowserRouter([
  {
    path: '/',
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
