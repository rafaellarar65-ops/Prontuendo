import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';
import { AuthPage } from '../e2e/page-objects/auth-page';
import { testUsers } from '../e2e/test-data';

const clinicalRoutes = [
  '/dashboard',
  '/pacientes',
  '/agenda',
  '/consultas',
  '/bioimpedancia',
  '/exames',
  '/templates',
  '/protocolos',
  '/configuracoes',
];

const patientPortalRoutes = [
  '/',
  '/glicemia',
  '/exames',
  '/documentos',
  '/questionario',
  '/perfil',
];

test.describe('Acessibilidade com axe-core', () => {
  test('frontend clínico sem violações serious/critical', async ({ page }) => {
    const authPage = new AuthPage(page);
    await authPage.gotoLogin();
    await authPage.login(testUsers.doctor.email, testUsers.doctor.password);

    for (const route of clinicalRoutes) {
      await page.goto(route);
      const accessibilityScanResults = await new AxeBuilder({ page }).analyze();
      const blockers = accessibilityScanResults.violations.filter((v) =>
        ['serious', 'critical'].includes(v.impact ?? ''),
      );
      expect(blockers, `violações em ${route}`).toEqual([]);
    }
  });

  test('portal paciente sem violações serious/critical', async ({ page }) => {
    const authPage = new AuthPage(page);
    await authPage.gotoLogin();
    await authPage.login(testUsers.patient.email, testUsers.patient.password);

    for (const route of patientPortalRoutes) {
      await page.goto(route);
      const accessibilityScanResults = await new AxeBuilder({ page }).analyze();
      const blockers = accessibilityScanResults.violations.filter((v) =>
        ['serious', 'critical'].includes(v.impact ?? ''),
      );
      expect(blockers, `violações em ${route}`).toEqual([]);
    }
  });
});
