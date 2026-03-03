import { Test } from '@nestjs/testing';

import { ScoresService } from './scores.service';

describe('ScoresService', () => {
  it('deve calcular e listar por tenant e médico', async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [ScoresService],
    }).compile();

    const service = moduleRef.get(ScoresService);

    service.calculateBmi('t1', 'med1', 'p1', {
      weightKg: 90,
      heightM: 1.8,
    });

    service.calculateBmi('t1', 'med2', 'p1', {
      weightKg: 82,
      heightM: 1.7,
    });

    service.calculateBmi('t2', 'med1', 'p1', {
      weightKg: 95,
      heightM: 1.75,
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

    service.calculateHomaIr('t1', 'med1', 'p1', {
      fastingGlucose: 90,
      fastingInsulin: 10,
    });
    service.calculateFindrisc('t1', 'med1', 'p1', {
      ageScore: 2,
      bmiScore: 1,
      waistScore: 3,
      physicalActivityScore: 0,
      fruitsVegetablesScore: 1,
      antiHypertensiveScore: 0,
      highGlucoseHistoryScore: 5,
      familyHistoryScore: 3,
    });

    expect(service.latest('t1', 'med1', 'p1')?.scoreType).toBe('findrisc');
  });
});
