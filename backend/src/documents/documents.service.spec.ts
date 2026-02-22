import { Test } from '@nestjs/testing';

import { DocumentsService } from './documents.service';

describe('DocumentsService', () => {
  it('deve criar e listar por tenant', async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [DocumentsService],
    }).compile();

    const service = moduleRef.get(DocumentsService);
    service.create('t1', 'u1', { nome: 'x' });
    service.create('t2', 'u2', { nome: 'y' });

    expect(service.list('t1')).toHaveLength(1);
    expect(service.list('t2')).toHaveLength(1);
  });
});
