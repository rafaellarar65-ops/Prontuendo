import { expect, test } from '@playwright/test';
import { AuthPage } from './page-objects/auth-page';
import { makeUniqueId, testUsers } from './test-data';

test.describe('Documentos clínicos via templates', () => {
  test('gerar prescrição, atestado e relatório de bioimpedância', async ({ page }) => {
    const authPage = new AuthPage(page);
    const caseRef = makeUniqueId('docs');

    await authPage.gotoLogin();
    await authPage.login(testUsers.doctor.email, testUsers.doctor.password);

    await page.goto('/templates');
    await expect(page.getByRole('heading', { name: /templates/i })).toBeVisible();

    for (const type of ['Prescrição', 'Atestado', 'Relatório de Bioimpedância']) {
      await page.getByRole('button', { name: new RegExp(type, 'i') }).click();
      await page.getByLabel(/referência|id do documento/i).fill(caseRef);

      const [download] = await Promise.all([
        page.waitForEvent('download'),
        page.getByRole('button', { name: /gerar pdf|emitir/i }).click(),
      ]);

      expect(download.suggestedFilename()).toContain(caseRef);
    }
  });
});
