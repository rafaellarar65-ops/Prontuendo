import { Test } from '@nestjs/testing';

import { PrismaService } from '../prisma/prisma.service';
import { PrescriptionsService } from './prescriptions.service';

describe('PrescriptionsService', () => {
  it('deve instanciar o serviço', async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [
        PrescriptionsService,
        {
          provide: PrismaService,
          useValue: {
            activityLog: { create: jest.fn() },
          },
        },
      ],
    }).compile();

    const service = moduleRef.get(PrescriptionsService);
    expect(service).toBeDefined();
  });
});
