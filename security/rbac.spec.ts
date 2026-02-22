import { expect, test } from '@playwright/test';
import { AuthPage } from '../e2e/page-objects/auth-page';
import { testUsers } from '../e2e/test-data';

test.describe('RBAC | segurança de acesso', () => {
  test('RECEPCAO não acessa prontuário clínico', async ({ page }) => {
    const authPage = new AuthPage(page);
    await authPage.gotoLogin();
    await authPage.login(testUsers.receptionist.email, testUsers.receptionist.password);

    await page.goto('/consultas');
    await expect(page.getByText(/acesso negado|não autorizado/i)).toBeVisible();

    const apiResponse = await page.request.get('/api/consultations');
    expect(apiResponse.status()).toBe(403);
  });

  test('paciente não acessa dados de outro paciente', async ({ page }) => {
    const authPage = new AuthPage(page);
    await authPage.gotoLogin();
    await authPage.login(testUsers.patient.email, testUsers.patient.password);

    const forbiddenResponse = await page.request.get('/api/patients/another-patient-id');
    expect([403, 404]).toContain(forbiddenResponse.status());
  });
});
