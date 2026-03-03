import { Test } from '@nestjs/testing';

import { DocumentsService } from './documents.service';

describe('DocumentsService', () => {
  it('deve filtrar por paciente e categoria', async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [DocumentsService],
    }).compile();

    const service = moduleRef.get(DocumentsService);
    const file = {
      originalname: 'arquivo.txt',
      mimetype: 'text/plain',
      buffer: Buffer.from('conteudo'),
    };

    const primeiro = await service.upload('t1', 'u1', file, {
      patientId: '11111111-1111-1111-1111-111111111111',
      category: 'lab',
    });

    await service.upload('t1', 'u1', file, {
      patientId: '11111111-1111-1111-1111-111111111111',
      category: 'image',
    });

    expect(service.listByPatient('t1', primeiro.patientId)).toHaveLength(2);
    expect(service.listByPatient('t1', primeiro.patientId, 'lab')).toHaveLength(1);
  });
});
