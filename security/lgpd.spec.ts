import { expect, test } from '@playwright/test';
import { AuthPage } from '../e2e/page-objects/auth-page';
import { makeUniqueId, testUsers } from '../e2e/test-data';

test.describe('LGPD | auditoria, consentimento e isolamento', () => {
  test('toda mutação gera audit trail e consentimento registrado', async ({ page }) => {
    const authPage = new AuthPage(page);
    const traceId = makeUniqueId('lgpd');

    await authPage.gotoLogin();
    await authPage.login(testUsers.doctor.email, testUsers.doctor.password);

    const mutation = await page.request.patch('/api/patients/self', {
      data: { emergencyContact: `Contato ${traceId}`, consentTermsAccepted: true },
    });
    expect(mutation.ok()).toBeTruthy();

    const auditTrail = await page.request.get(`/api/audit?traceId=${traceId}`);
    expect(auditTrail.ok()).toBeTruthy();
    await expect.poll(async () => (await auditTrail.json()).length).toBeGreaterThan(0);

    const consent = await page.request.get('/api/lgpd/consents/self');
    expect(consent.ok()).toBeTruthy();
  });

  test('dados sensíveis retornam cifrados e sem vazamento cross-tenant', async ({ page }) => {
    const authPage = new AuthPage(page);
    await authPage.gotoLogin();
    await authPage.login(testUsers.doctor.email, testUsers.doctor.password);

    const piiRaw = await page.request.get('/api/internal/patients/raw?patientId=self');
    expect(piiRaw.ok()).toBeTruthy();
    const payload = await piiRaw.json();
    expect(payload.cpf).toMatch(/^enc:/);
    expect(payload.email).toMatch(/^enc:/);

    const crossTenant = await page.request.get('/api/patients?tenantId=foreign-tenant');
    expect([403, 404]).toContain(crossTenant.status());
  });
});
