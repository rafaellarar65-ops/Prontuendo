import { UnauthorizedException } from '@nestjs/common';
import { Test } from '@nestjs/testing';

import { PrismaService } from '../prisma/prisma.service';
import { PatientPortalService } from './patient-portal.service';

describe('PatientPortalService', () => {
  it('deve bloquear acesso quando patientId não corresponde ao usuário logado', async () => {
    const prismaMock = {} as PrismaService;
    const moduleRef = await Test.createTestingModule({
      providers: [PatientPortalService, { provide: PrismaService, useValue: prismaMock }],
    }).compile();

    const service = moduleRef.get(PatientPortalService);

    await expect(service.myGlucose('t1', 'patient-a', 'patient-b')).rejects.toBeInstanceOf(UnauthorizedException);
  });
});
