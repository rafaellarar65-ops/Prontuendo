import { Test } from '@nestjs/testing';

import { ScoresService } from './scores.service';

describe('ScoresService', () => {
  it('deve calcular e listar por tenant e médico', async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [ScoresService],
    }).compile();

    const service = moduleRef.get(ScoresService);

    service.calculate('t1', 'med1', {
      patientId: 'p1',
      scoreType: 'risco-cardiaco',
      parameters: { idade: 50, imc: 30 },
    });

    service.calculate('t1', 'med2', {
      patientId: 'p1',
      scoreType: 'risco-cardiaco',
      parameters: { idade: 45, imc: 28 },
    });

    service.calculate('t2', 'med1', {
      patientId: 'p1',
      scoreType: 'risco-cardiaco',
      parameters: { idade: 60, imc: 31 },
    });

    expect(service.list('t1', 'med1', {})).toHaveLength(1);
    expect(service.list('t1', 'med2', {})).toHaveLength(1);
    expect(service.list('t2', 'med1', {})).toHaveLength(1);
  });

  it('deve retornar o último escore do paciente', async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [ScoresService],
    }).compile();

    const service = moduleRef.get(ScoresService);

    service.calculate('t1', 'med1', {
      patientId: 'p1',
      scoreType: 'tipo-1',
      parameters: { p: 1 },
    });
    service.calculate('t1', 'med1', {
      patientId: 'p1',
      scoreType: 'tipo-2',
      parameters: { p: 2 },
    });

    expect(service.latest('t1', 'med1', 'p1')?.scoreType).toBe('tipo-2');
  });
});
