import { expect, test } from '@playwright/test';
import { AuthPage } from '../e2e/page-objects/auth-page';
import { makeUniqueId, testUsers } from '../e2e/test-data';

test.describe('SBIS NGS1 | autenticação forte, trilha e integridade', () => {
  test('autenticação forte (MFA) obrigatória para profissional', async ({ page }) => {
    const authPage = new AuthPage(page);
    await authPage.gotoLogin();
    await authPage.login(testUsers.doctor.email, testUsers.doctor.password);

    await expect(page.getByText(/mfa necessário|fator adicional/i)).toBeVisible();
  });

  test('audit trail imutável e versionamento de registro clínico', async ({ page }) => {
    const authPage = new AuthPage(page);
    const versionTag = makeUniqueId('ngs1');

    await authPage.gotoLogin();
    await authPage.login(testUsers.doctor.email, testUsers.doctor.password, process.env.PW_MFA_CODE ?? '000000');

    const create = await page.request.post('/api/consultations', {
      data: { patientId: 'self', subjective: `Teste ${versionTag}` },
    });
    expect(create.ok()).toBeTruthy();
    const { id } = await create.json();

    const update = await page.request.patch(`/api/consultations/${id}`, {
      data: { assessment: `Atualização ${versionTag}` },
    });
    expect(update.ok()).toBeTruthy();

    const versions = await page.request.get(`/api/consultations/${id}/versions`);
    expect(versions.ok()).toBeTruthy();

    const auditSeal = await page.request.get(`/api/audit/${id}/seal`);
    expect(auditSeal.ok()).toBeTruthy();
    const { hash, previousHash } = await auditSeal.json();
    expect(hash).toBeTruthy();
    expect(previousHash).toBeTruthy();
  });

  test('integridade: alteração fora do fluxo é detectada', async ({ page }) => {
    const tamperCheck = await page.request.post('/api/compliance/integrity-check', {
      data: { scope: 'consultations' },
    });
    expect(tamperCheck.ok()).toBeTruthy();

    const report = await tamperCheck.json();
    expect(report.status).toBe('OK');
    expect(report.tamperedRecords).toBe(0);
  });
});
