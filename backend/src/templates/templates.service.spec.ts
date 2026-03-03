import { Test } from '@nestjs/testing';

import { TemplatesService } from './templates.service';

describe('TemplatesService', () => {
  it('deve criar e listar por tenant', async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [TemplatesService],
    }).compile();

    const service = moduleRef.get(TemplatesService);
    service.create('t1', 'u1', { name: 'x', canvasJson: { text: 'A' } });
    service.create('t2', 'u2', { name: 'y', canvasJson: { text: 'B' } });

    expect(service.list('t1')).toHaveLength(1);
    expect(service.list('t2')).toHaveLength(1);
  });
});
