import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';

import { serializeArray, deserializeArray, serializeJson } from '../common/json-helper';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePatientDto } from './dto/create-patient.dto';
import { ListPatientsDto } from './dto/list-patients.dto';
import { UpdatePatientDto } from './dto/update-patient.dto';

@Injectable()
export class PatientsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(tenantId: string, actorId: string, dto: CreatePatientDto) {
    const patient = await this.prisma.patient.create({
      data: {
        tenantId,
        fullName: dto.fullName,
        cpf: dto.cpf,
        birthDate: dto.birthDate ? new Date(dto.birthDate) : undefined,
        tags: serializeArray(dto.tags ?? []),
        lifecycle: dto.lifecycle ?? 'ACTIVE',
      },
    });

    await this.logMutation(tenantId, actorId, 'CREATE', patient.id);
    return {
      ...patient,
      tags: deserializeArray(patient.tags),
    };
  }

  async findAll(tenantId: string, query: ListPatientsDto) {
    const where: Prisma.PatientWhereInput = {
      tenantId,
      lifecycle: query.lifecycle,
      fullName: query.q ? { contains: query.q, mode: 'insensitive' } : undefined,
    };

    const patients = await this.prisma.patient.findMany({
      where,
      skip: (query.page - 1) * query.perPage,
      take: query.perPage,
      orderBy: { createdAt: 'desc' },
    });

    // Filter by tag if needed (manual filter since SQLite doesn't support array operations)
    let filteredPatients = patients;
    if (query.tag) {
      filteredPatients = patients.filter(p => {
        const tags = deserializeArray(p.tags);
        return tags.includes(query.tag!);
      });
    }

    return filteredPatients.map(p => ({
      ...p,
      tags: deserializeArray(p.tags),
    }));
  }


  async findOne(tenantId: string, id: string) {
    const patient = await this.prisma.patient.findUnique({
      where: { id_tenantId: { id, tenantId } },
    });
    
    if (!patient) return null;
    
    return {
      ...patient,
      tags: deserializeArray(patient.tags),
    };
  }

  async update(tenantId: string, actorId: string, id: string, dto: UpdatePatientDto) {
    const payload: Prisma.PatientUpdateInput = {
      ...dto,
      birthDate: dto.birthDate ? new Date(dto.birthDate) : undefined,
      tags: dto.tags ? serializeArray(dto.tags) : undefined,
    };

    return this.prisma.$transaction(async (trx) => {
      const patient = await trx.patient.update({
        where: { id_tenantId: { id, tenantId } },
        data: payload,
      });

      await trx.activityLog.create({
        data: {
          tenantId,
          actorId,
          action: 'UPDATE',
          resource: 'patient',
          metadata: serializeJson({ patientId: id, fields: Object.keys(dto) }),
        },
      });

      return {
        ...patient,
        tags: deserializeArray(patient.tags),
      };
    });
  }

  async remove(tenantId: string, actorId: string, id: string) {
    await this.prisma.patient.delete({ where: { id_tenantId: { id, tenantId } } });
    await this.logMutation(tenantId, actorId, 'DELETE', id);

    return { deleted: true };
  }

  private async logMutation(tenantId: string, actorId: string, action: string, patientId: string) {
    await this.prisma.activityLog.create({
      data: {
        tenantId,
        actorId,
        action,
        resource: 'patient',
        metadata: serializeJson({ patientId }),
      },
    });
  }
}
