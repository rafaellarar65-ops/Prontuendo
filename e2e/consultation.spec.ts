import { expect, test } from '@playwright/test';
import { ConsultationPage } from './page-objects/consultation-page';
import { makeUniqueId, testUsers } from './test-data';
import { AuthPage } from './page-objects/auth-page';

test.describe('Consulta SOAP | autosave, versionamento e assinatura', () => {
  test('criar consulta SOAP completa com autosave e assinatura digital', async ({ page }) => {
    const authPage = new AuthPage(page);
    const consultationPage = new ConsultationPage(page);
    const patientName = `Paciente QA ${makeUniqueId('soap')}`;

    await authPage.gotoLogin();
    await authPage.login(testUsers.doctor.email, testUsers.doctor.password, process.env.PW_MFA_CODE ?? '000000');

    await consultationPage.openNewConsultation(patientName);
    await consultationPage.fillSoap('Cansaço e ganho de peso', 'Hipotireoidismo subclínico', 'Solicitar TSH/T4 e retorno em 30 dias');

    await expect(page.getByText(/rascunho salvo|autosave/i)).toBeVisible();
    await consultationPage.signConsultation();

    await expect(page.getByText(/assinatura confirmada|documento assinado/i)).toBeVisible();
    await page.getByRole('button', { name: /histórico de versões/i }).click();
    await expect(page.getByRole('table', { name: /versões/i })).toContainText('v1');
  });
});
