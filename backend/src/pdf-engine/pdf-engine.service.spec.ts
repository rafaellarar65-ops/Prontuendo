import { Test } from '@nestjs/testing';

import { PdfEngineService } from './pdf-engine.service';

describe('PdfEngineService', () => {
  it('deve criar e listar por tenant', async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [PdfEngineService],
    }).compile();

    const service = moduleRef.get(PdfEngineService);
    service.create('t1', 'u1', { nome: 'x' });
    service.create('t2', 'u2', { nome: 'y' });

    expect(service.list('t1')).toHaveLength(1);
    expect(service.list('t2')).toHaveLength(1);
  });
});
