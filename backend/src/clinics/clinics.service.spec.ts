import { Test } from '@nestjs/testing';

import { ClinicsService } from './clinics.service';

describe('ClinicsService', () => {
  it('deve criar e listar por tenant', async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [ClinicsService],
    }).compile();

    const service = moduleRef.get(ClinicsService);
    service.create('t1', 'u1', { nome: 'x' });
    service.create('t2', 'u2', { nome: 'y' });

    expect(service.list('t1')).toHaveLength(1);
    expect(service.list('t2')).toHaveLength(1);
  });
});
