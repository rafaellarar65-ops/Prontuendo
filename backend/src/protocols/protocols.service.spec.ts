import { NotFoundException } from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service';
import { ProtocolsService } from './protocols.service';

describe('ProtocolsService', () => {
  const protocolDelegate = {
    create: jest.fn(),
    findMany: jest.fn(),
    findFirst: jest.fn(),
    updateMany: jest.fn(),
    deleteMany: jest.fn(),
  };

  const prisma = { protocol: protocolDelegate } as unknown as PrismaService;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('deve criar com escopo tenant e actor', async () => {
    const service = new ProtocolsService(prisma);
    protocolDelegate.create.mockResolvedValue({ id: 'p1' });

    await service.create('t1', 'u1', {
      targetCondition: 'E11',
      steps: [],
      medications: [],
      inclusionCriteria: {},
    });

    expect(protocolDelegate.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ tenantId: 't1', createdBy: 'u1', updatedBy: 'u1' }),
      }),
    );
  });

  it('deve lançar NotFoundException quando protocolo não existir no tenant', async () => {
    const service = new ProtocolsService(prisma);
    protocolDelegate.findFirst.mockResolvedValue(null);

    await expect(service.findById('t1', 'missing')).rejects.toBeInstanceOf(NotFoundException);
  });
});
