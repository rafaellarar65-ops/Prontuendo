import { Test } from '@nestjs/testing';

import { PrismaService } from '../prisma/prisma.service';
import { DocumentsService } from './documents.service';

describe('DocumentsService', () => {
  it('deve instanciar o serviço', async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [
        DocumentsService,
        {
          provide: PrismaService,
          useValue: {
            tenant: { findUnique: jest.fn() },
            patient: { findFirst: jest.fn() },
            consultation: { findFirst: jest.fn() },
            document: { create: jest.fn(), findMany: jest.fn(), findFirst: jest.fn(), delete: jest.fn() },
          },
        },
      ],
    }).compile();

    const service = moduleRef.get(DocumentsService);
    expect(service).toBeDefined();
  });
});
