import { expect, Page } from '@playwright/test';

export class ConsultationPage {
  constructor(private readonly page: Page) {}

  async openNewConsultation(patientName: string) {
    await this.page.goto('/pacientes');
    await this.page.getByPlaceholder(/buscar paciente/i).fill(patientName);
    await this.page.getByRole('button', { name: /nova consulta|iniciar consulta/i }).first().click();
    await expect(this.page.getByRole('heading', { name: /consulta/i })).toBeVisible();
  }

  async fillSoap(complaint: string, diagnosis: string, plan: string) {
    await this.page.getByLabel(/subjetivo|queixa principal/i).fill(complaint);
    await this.page.getByLabel(/objetivo|exame físico/i).fill('PA 120x80 mmHg, sem alterações agudas.');
    await this.page.getByLabel(/avaliação|diagnóstico/i).fill(diagnosis);
    await this.page.getByLabel(/plano|conduta/i).fill(plan);
  }

  async signConsultation() {
    await this.page.getByRole('button', { name: /assinar/i }).click();
    await this.page.getByLabel(/senha de assinatura|token/i).fill(process.env.PW_SIGNATURE_PASSWORD ?? 'Assinatura@123');
    await this.page.getByRole('button', { name: /confirmar assinatura/i }).click();
  }
}
