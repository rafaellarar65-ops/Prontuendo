import { UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Test } from '@nestjs/testing';

import { PrismaService } from '../prisma/prisma.service';
import { AuthService } from './auth.service';

describe('AuthService', () => {
  it('deve falhar login com credenciais inválidas', async () => {
    const prismaMock = {
      user: { findFirst: jest.fn().mockResolvedValue(null) },
    } as unknown as PrismaService;

    const moduleRef = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: PrismaService, useValue: prismaMock },
        { provide: JwtService, useValue: { signAsync: jest.fn() } },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((_k: string, d: string) => d),
            getOrThrow: jest.fn().mockReturnValue('secret'),
          },
        },
      ],
    }).compile();

    const service = moduleRef.get(AuthService);

    await expect(
      service.login('tenant-1', { email: 'x@x.com', password: '12345678' }),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });
});
