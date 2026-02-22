import { Test } from '@nestjs/testing';

import { ConfigService } from './config.service';

describe('ConfigService', () => {
  it('deve criar e listar por tenant', async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [ConfigService],
    }).compile();

    const service = moduleRef.get(ConfigService);
    service.create('t1', 'u1', { nome: 'x' });
    service.create('t2', 'u2', { nome: 'y' });

    expect(service.list('t1')).toHaveLength(1);
    expect(service.list('t2')).toHaveLength(1);
  });
});
