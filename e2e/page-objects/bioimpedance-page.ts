import { expect, Page } from '@playwright/test';

export class BioimpedancePage {
  constructor(private readonly page: Page) {}

  async goToBioimpedance() {
    await this.page.goto('/bioimpedancia');
    await expect(this.page.getByRole('heading', { name: /bioimpedância/i })).toBeVisible();
  }

  async uploadExam(filePath: string) {
    await this.page.getByLabel(/upload|enviar exame/i).setInputFiles(filePath);
    await this.page.getByRole('button', { name: /extrair com ia/i }).click();
  }

  async confirmExtraction() {
    await expect(this.page.getByText(/extração concluída/i)).toBeVisible();
    await this.page.getByRole('button', { name: /confirmar dados/i }).click();
  }
}
