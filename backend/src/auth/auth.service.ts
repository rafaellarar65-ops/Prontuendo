import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { randomBytes } from 'node:crypto';

import { PrismaService } from '../prisma/prisma.service';
import { ChangePasswordDto } from './dto/change-password.dto';
import { LoginDto } from './dto/login.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { RegisterDto } from './dto/register.dto';

type AuthenticatedUser = {
  id: string;
  tenantId: string;
  email: string;
  fullName: string;
  role: string;
  patientLinkId: string | null;
};

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async register(tenantId: string, dto: RegisterDto) {
    const email = dto.email.toLowerCase();

    const existing = await this.prisma.user.findFirst({
      where: { tenantId, email },
      select: { id: true },
    });

    if (existing) {
      throw new UnauthorizedException('Usuário já cadastrado para esta clínica');
    }

    const passwordHash = await bcrypt.hash(dto.password, 10);

    const user = await this.prisma.user.create({
      data: {
        tenantId,
        email,
        fullName: dto.fullName,
        role: dto.role,
        patientLinkId: dto.patientLinkId,
        passwordHash,
      },
      select: {
        id: true,
        tenantId: true,
        email: true,
        fullName: true,
        role: true,
        patientLinkId: true,
      },
    });

    return this.issueTokens(user);
  }

  async login(tenantId: string, dto: LoginDto) {
    const user = await this.validateUserCredentials(tenantId, dto, false);
    return this.issueTokens(user);
  }

  async loginPatient(tenantId: string, dto: LoginDto) {
    const user = await this.validateUserCredentials(tenantId, dto, true);
    return this.issueTokens(user);
  }

  async changePassword(tenantId: string, userId: string, dto: ChangePasswordDto) {
    const user = await this.prisma.user.findFirst({
      where: { id: userId, tenantId, isActive: true },
      select: { id: true, passwordHash: true },
    });

    if (!user) {
      throw new UnauthorizedException('Usuário não encontrado');
    }

    const passwordMatch = await bcrypt.compare(dto.currentPassword, user.passwordHash);
    if (!passwordMatch) {
      throw new UnauthorizedException('Senha atual inválida');
    }

    const newHash = await bcrypt.hash(dto.newPassword, 10);
    await this.prisma.user.update({ where: { id: user.id }, data: { passwordHash: newHash } });
    await this.prisma.refreshToken.deleteMany({ where: { userId: user.id, tenantId } });

    return { success: true };
  }

  async refresh(tenantId: string, userId: string, dto: RefreshTokenDto) {
    const tokens = await this.prisma.refreshToken.findMany({
      where: {
        tenantId,
        userId,
        expiresAt: { gt: new Date() },
      },
      orderBy: { createdAt: 'desc' },
    });

    let validTokenId: string | null = null;
    for (const token of tokens) {
      const isMatch = await bcrypt.compare(dto.refreshToken, token.tokenHash);
      if (isMatch) {
        validTokenId = token.id;
        break;
      }
    }

    if (!validTokenId) {
      throw new UnauthorizedException('Refresh token inválido');
    }

    await this.prisma.refreshToken.delete({ where: { id: validTokenId } });

    const user = await this.prisma.user.findFirst({
      where: { id: userId, tenantId, isActive: true },
      select: {
        id: true,
        tenantId: true,
        email: true,
        fullName: true,
        role: true,
        patientLinkId: true,
      },
    });

    if (!user) {
      throw new UnauthorizedException('Usuário não encontrado');
    }

    return this.issueTokens(user);
  }

  private async validateUserCredentials(tenantId: string, dto: LoginDto, patientOnly: boolean) {
    const email = dto.email.toLowerCase();

    const user = await this.prisma.user.findFirst({
      where: {
        tenantId,
        email,
        isActive: true,
        ...(patientOnly ? { role: 'PATIENT' } : { NOT: { role: 'PATIENT' } }),
      },
      select: {
        id: true,
        tenantId: true,
        email: true,
        fullName: true,
        role: true,
        patientLinkId: true,
        passwordHash: true,
      },
    });

    if (!user) {
      throw new UnauthorizedException('Credenciais inválidas');
    }

    const passwordMatch = await bcrypt.compare(dto.password, user.passwordHash);
    if (!passwordMatch) {
      throw new UnauthorizedException('Credenciais inválidas');
    }

    const { passwordHash: _passwordHash, ...safeUser } = user;
    return safeUser;
  }

  private async issueTokens(user: AuthenticatedUser) {
    const payload = {
      sub: user.id,
      tenantId: user.tenantId,
      email: user.email,
      roles: [user.role],
      patientId: user.patientLinkId ?? undefined,
    };

    const accessToken = await this.jwtService.signAsync(payload);
    const refreshToken = randomBytes(48).toString('base64url');
    const refreshTokenHash = await bcrypt.hash(refreshToken, 10);

    await this.prisma.refreshToken.create({
      data: {
        tenantId: user.tenantId,
        userId: user.id,
        tokenHash: refreshTokenHash,
        expiresAt: this.getRefreshTokenExpiryDate(),
      },
    });

    return {
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        tenantId: user.tenantId,
        email: user.email,
        fullName: user.fullName,
        roles: [user.role],
        patientId: user.patientLinkId ?? undefined,
      },
    };
  }

  private getRefreshTokenExpiryDate() {
    const expiresIn = this.configService.get<string>('JWT_REFRESH_EXPIRES_IN', '30d');
    return new Date(Date.now() + this.parseDurationToMs(expiresIn));
  }

  private parseDurationToMs(duration: string) {
    const match = duration.match(/^(\d+)([smhd])$/);
    if (!match) {
      return 1000 * 60 * 60 * 24 * 30;
    }

    const amount = Number(match[1]);
    const unit = match[2];

    const unitMs: Record<string, number> = {
      s: 1000,
      m: 1000 * 60,
      h: 1000 * 60 * 60,
      d: 1000 * 60 * 60 * 24,
    };

    return amount * unitMs[unit];
  }
}
