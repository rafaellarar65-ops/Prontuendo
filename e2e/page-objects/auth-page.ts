import { expect, Page } from '@playwright/test';

export class AuthPage {
  constructor(private readonly page: Page) {}

  async gotoLogin() {
    await this.page.goto('/login');
    await expect(this.page.getByRole('heading', { name: /login|acessar/i })).toBeVisible();
  }

  async login(email: string, password: string, otpCode?: string) {
    await this.page.getByLabel(/e-mail|email/i).fill(email);
    await this.page.getByLabel(/senha/i).fill(password);
    await this.page.getByRole('button', { name: /entrar|login/i }).click();

    if (otpCode) {
      await this.page.getByLabel(/código|otp|mfa/i).fill(otpCode);
      await this.page.getByRole('button', { name: /validar|confirmar/i }).click();
    }
  }

  async logout() {
    await this.page.getByRole('button', { name: /perfil|menu|conta/i }).click();
    await this.page.getByRole('button', { name: /sair|logout/i }).click();
  }
}
