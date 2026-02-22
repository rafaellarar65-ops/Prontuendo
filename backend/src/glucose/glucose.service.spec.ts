import { Test } from '@nestjs/testing';

import { PrismaService } from '../prisma/prisma.service';
import { GlucoseService } from './glucose.service';

describe('GlucoseService', () => {
  it('deve calcular stats com time in range', async () => {
    const prismaMock = {
      glucoseLog: {
        findMany: jest.fn().mockResolvedValue([
          { value: 100 },
          { value: 200 },
          { value: 150 },
        ]),
      },
    } as unknown as PrismaService;

    const moduleRef = await Test.createTestingModule({
      providers: [GlucoseService, { provide: PrismaService, useValue: prismaMock }],
    }).compile();

    const service = moduleRef.get(GlucoseService);
    const stats = await service.stats('t1', 'p1');

    expect(stats.count).toBe(3);
    expect(stats.timeInRange).toBeGreaterThan(0);
  });
});
