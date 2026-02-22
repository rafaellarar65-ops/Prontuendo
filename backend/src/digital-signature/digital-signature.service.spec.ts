import { Test } from '@nestjs/testing';

import { DigitalSignatureService } from './digital-signature.service';

describe('DigitalSignatureService', () => {
  it('deve criar e listar por tenant', async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [DigitalSignatureService],
    }).compile();

    const service = moduleRef.get(DigitalSignatureService);
    service.create('t1', 'u1', { nome: 'x' });
    service.create('t2', 'u2', { nome: 'y' });

    expect(service.list('t1')).toHaveLength(1);
    expect(service.list('t2')).toHaveLength(1);
  });
});
