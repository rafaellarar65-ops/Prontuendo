import { Test } from '@nestjs/testing';

import { ProtocolStatus } from './dto/protocol-status.enum';
import { ProtocolsService } from './protocols.service';

describe('ProtocolsService', () => {
  it('deve criar e listar por tenant', async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [ProtocolsService],
    }).compile();

    const service = moduleRef.get(ProtocolsService);
    service.create('t1', 'u1', { name: 'x', condition: 'Hipertensão' });
    service.create('t2', 'u2', { name: 'y', condition: 'Diabetes' });

    expect(service.list('t1', { page: 1, perPage: 20 }).data).toHaveLength(1);
    expect(service.list('t2', { page: 1, perPage: 20 }).data).toHaveLength(1);
  });

  it('deve ativar e desativar protocolo', async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [ProtocolsService],
    }).compile();

    const service = moduleRef.get(ProtocolsService);
    const protocol = service.create('t1', 'u1', { name: 'x', condition: 'Hipertensão' });

    const deactivated = service.deactivate('t1', protocol.id);
    expect(deactivated?.status).toBe(ProtocolStatus.INACTIVE);

    const activated = service.activate('t1', protocol.id);
    expect(activated?.status).toBe(ProtocolStatus.ACTIVE);
  });
});
