import { Test } from '@nestjs/testing';

import { ProtocolsService } from './protocols.service';

describe('ProtocolsService', () => {
  it('deve criar e listar por tenant', async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [ProtocolsService],
    }).compile();

    const service = moduleRef.get(ProtocolsService);
    service.create('t1', 'u1', {
      name: 'x',
      description: 'desc',
      targetCondition: 'dm2',
      status: 'draft',
      steps: [],
      medications: [],
      inclusionCriteria: { all: [], any: [], exclusions: [] },
      references: [],
    });
    service.create('t2', 'u2', {
      name: 'y',
      description: 'desc',
      targetCondition: 'obesity',
      status: 'active',
      steps: [],
      medications: [],
      inclusionCriteria: { all: [], any: [], exclusions: [] },
      references: [],
    });

    expect(service.list('t1', { page: 1, perPage: 20 })).toHaveLength(1);
    expect(service.list('t2', { page: 1, perPage: 20 })).toHaveLength(1);
  });
});
