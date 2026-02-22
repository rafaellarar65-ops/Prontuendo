import { expect, test } from '@playwright/test';
import { AuthPage } from './page-objects/auth-page';
import { testUsers } from './test-data';

test.describe('Auth | Login, MFA, refresh e sessão', () => {
  test('médico realiza login com MFA e mantém sessão com refresh token', async ({ page, context }) => {
    const authPage = new AuthPage(page);

    await authPage.gotoLogin();
    await authPage.login(testUsers.doctor.email, testUsers.doctor.password, process.env.PW_MFA_CODE ?? '000000');

    await expect(page).toHaveURL(/dashboard|home/);
    const sessionResponse = await page.request.get('/api/auth/session');
    expect(sessionResponse.ok()).toBeTruthy();

    const refreshResponse = await page.request.post('/api/auth/refresh', {
      data: { refreshToken: (await context.cookies()).find((c) => c.name === 'refresh_token')?.value },
    });
    expect(refreshResponse.ok()).toBeTruthy();
  });

  test('paciente realiza login e logout com invalidação de sessão', async ({ page }) => {
    const authPage = new AuthPage(page);

    await authPage.gotoLogin();
    await authPage.login(testUsers.patient.email, testUsers.patient.password);
    await expect(page).toHaveURL(/glicemia|home|portal/);

    await authPage.logout();
    await expect(page).toHaveURL(/login/);

    const meAfterLogout = await page.request.get('/api/auth/me');
    expect(meAfterLogout.status()).toBeGreaterThanOrEqual(401);
  });

  test('sessão expirada força relogin e não permite mutações', async ({ page }) => {
    const authPage = new AuthPage(page);

    await authPage.gotoLogin();
    await authPage.login(testUsers.doctor.email, testUsers.doctor.password);

    await page.context().clearCookies();
    await page.goto('/pacientes');
    await expect(page).toHaveURL(/login/);

    const mutationResponse = await page.request.post('/api/consultations', {
      data: { patientId: 'expired-session-test' },
    });
    expect(mutationResponse.status()).toBe(401);
  });
});
