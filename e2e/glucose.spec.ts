import { expect, test } from '@playwright/test';
import { AuthPage } from './page-objects/auth-page';
import { makeUniqueId, testUsers } from './test-data';

test.describe('Glicemia | registro pelo paciente e visualização médica', () => {
  test('paciente registra glicemia e médico vê no prontuário', async ({ browser }) => {
    const readingTag = makeUniqueId('glucose');

    const patientContext = await browser.newContext();
    const patientPage = await patientContext.newPage();
    const patientAuth = new AuthPage(patientPage);

    await patientAuth.gotoLogin();
    await patientAuth.login(testUsers.patient.email, testUsers.patient.password);
    await patientPage.goto('/glicemia');
    await patientPage.getByLabel(/valor/i).fill('126');
    await patientPage.getByLabel(/contexto|observação/i).fill(`Jejum ${readingTag}`);
    await patientPage.getByRole('button', { name: /registrar/i }).click();
    await expect(patientPage.getByText(/registro salvo/i)).toBeVisible();

    const doctorContext = await browser.newContext();
    const doctorPage = await doctorContext.newPage();
    const doctorAuth = new AuthPage(doctorPage);

    await doctorAuth.gotoLogin();
    await doctorAuth.login(testUsers.doctor.email, testUsers.doctor.password);
    await doctorPage.goto('/pacientes');
    await doctorPage.getByPlaceholder(/buscar paciente/i).fill(testUsers.patient.email);
    await doctorPage.getByRole('link', { name: /prontuário/i }).click();
    await doctorPage.getByRole('tab', { name: /glicemia/i }).click();
    await expect(doctorPage.getByText(readingTag)).toBeVisible();

    await patientContext.close();
    await doctorContext.close();
  });
});
