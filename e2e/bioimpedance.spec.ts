import path from 'node:path';
import { expect, test } from '@playwright/test';
import { AuthPage } from './page-objects/auth-page';
import { BioimpedancePage } from './page-objects/bioimpedance-page';
import { testUsers } from './test-data';

test.describe('Bioimpedância | upload, IA, dashboard e PDF', () => {
  test('pipeline completo de bioimpedância', async ({ page }) => {
    const authPage = new AuthPage(page);
    const bioPage = new BioimpedancePage(page);

    await authPage.gotoLogin();
    await authPage.login(testUsers.doctor.email, testUsers.doctor.password);

    await bioPage.goToBioimpedance();
    await bioPage.uploadExam(path.resolve('tests/fixtures/bioimpedance-sample.pdf'));
    await bioPage.confirmExtraction();

    await page.getByRole('tab', { name: /dashboard evolução/i }).click();
    await expect(page.getByText(/massa magra|gordura corporal|ângulo de fase/i)).toBeVisible();

    const [download] = await Promise.all([
      page.waitForEvent('download'),
      page.getByRole('button', { name: /gerar pdf/i }).click(),
    ]);
    expect(download.suggestedFilename()).toMatch(/bioimpedancia/i);
  });
});
