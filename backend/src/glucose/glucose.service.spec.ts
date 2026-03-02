import { Test } from '@nestjs/testing';

import { PrismaService } from '../prisma/prisma.service';
import { GlucoseService } from './glucose.service';

describe('GlucoseService', () => {
  it('deve analisar os registros e retornar tendência', async () => {
    const prismaMock = {
      glucoseLog: {
        findMany: jest.fn().mockResolvedValue([
          { value: 140, measuredAt: new Date('2025-01-03T10:00:00Z') },
          { value: 130, measuredAt: new Date('2025-01-02T10:00:00Z') },
          { value: 110, measuredAt: new Date('2025-01-01T10:00:00Z') },
        ]),
      },
    } as unknown as PrismaService;

    const moduleRef = await Test.createTestingModule({
      providers: [GlucoseService, { provide: PrismaService, useValue: prismaMock }],
    }).compile();

    const service = moduleRef.get(GlucoseService);
    const result = await service.analyzeGlucose('t1', 'p1');

    expect(result.count).toBe(3);
    expect(result.average).toBe(126.67);
    expect(result.lastValue).toBe(140);
    expect(result.trend).toBe('up');
  });
});
