import { Test } from '@nestjs/testing';

import { PrismaService } from '../prisma/prisma.service';
import { UsersService } from './users.service';

describe('UsersService', () => {
  it('deve listar usuários com filtro de tenant', async () => {
    const prismaMock = {
      user: { findMany: jest.fn().mockResolvedValue([]) },
    } as unknown as PrismaService;

    const moduleRef = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: PrismaService,
          useValue: prismaMock,
        },
      ],
    }).compile();

    const service = moduleRef.get(UsersService);
    await service.findAll('t1', { page: 1, perPage: 10 });

    expect(prismaMock.user.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { tenantId: 't1' } }),
    );
  });
});
