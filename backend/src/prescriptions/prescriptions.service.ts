import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';

import { PrismaService } from '../prisma/prisma.service';

type PrescriptionStatus = 'ATIVA' | 'CANCELADA';

type PrescriptionDelegate = {
  create(args: Record<string, unknown>): Promise<any>;
  findMany(args: Record<string, unknown>): Promise<any[]>;
  findFirst(args: Record<string, unknown>): Promise<any | null>;
  update(args: Record<string, unknown>): Promise<any>;
  updateMany(args: Record<string, unknown>): Promise<{ count: number }>;
};

@Injectable()
export class PrescriptionsService {
  constructor(private readonly prisma: PrismaService) {}

  private get prescription(): PrescriptionDelegate {
    return (this.prisma as unknown as { prescription: PrescriptionDelegate }).prescription;
  }

  async create(tenantId: string, clinicianId: string, dto: Record<string, unknown>) {
    const data = {
      tenantId,
      clinicianId,
      patientId: dto.patientId,
      consultationId: dto.consultationId ?? null,
      validUntil: dto.validUntil ? new Date(String(dto.validUntil)) : null,
      status: (dto.status as PrescriptionStatus | undefined) ?? 'ATIVA',
      notes: dto.notes ?? null,
    };

    const prescription = await this.prescription.create({ data });

    await this.prisma.activityLog.create({
      data: {
        tenantId,
        actorId: clinicianId,
        action: 'CREATE',
        resource: 'prescription',
        metadata: {
          prescriptionId: prescription.id,
          patientId: prescription.patientId,
          consultationId: prescription.consultationId,
        },
      },
    });

    return prescription;
  }

  findByPatient(tenantId: string, patientId: string, limit = 20) {
    return this.prescription.findMany({
      where: { tenantId, patientId },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }

  findByConsultation(tenantId: string, consultationId: string) {
    return this.prescription.findMany({
      where: { tenantId, consultationId },
      orderBy: { createdAt: 'desc' },
    });
  }

  findActive(tenantId: string, patientId: string) {
    const today = new Date();

    return this.prescription.findMany({
      where: {
        tenantId,
        patientId,
        status: 'ATIVA',
        OR: [{ validUntil: null }, { validUntil: { gte: today } }],
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async cancel(tenantId: string, id: string) {
    const current = await this.prescription.findFirst({ where: { id, tenantId } });
    if (!current) {
      throw new NotFoundException('Prescrição não encontrada');
    }

    const canceled = await this.prescription.update({
      where: { id },
      data: { status: 'CANCELADA' },
    });

    await this.prisma.activityLog.create({
      data: {
        tenantId,
        actorId: current.clinicianId,
        action: 'CANCEL',
        resource: 'prescription',
        metadata: { prescriptionId: id, previousStatus: current.status, nextStatus: 'CANCELADA' },
      },
    });

    return canceled;
  }

  async renew(tenantId: string, id: string, validUntil: Date | string | null) {
    const current = await this.prescription.findFirst({ where: { id, tenantId } });
    if (!current) {
      throw new NotFoundException('Prescrição não encontrada');
    }

    const renewed = await this.prescription.create({
      data: {
        tenantId,
        patientId: current.patientId,
        consultationId: current.consultationId,
        clinicianId: current.clinicianId,
        notes: current.notes ?? null,
        validUntil: validUntil ? new Date(String(validUntil)) : null,
        status: 'ATIVA',
      },
    });

    await this.prisma.activityLog.create({
      data: {
        tenantId,
        actorId: current.clinicianId,
        action: 'RENEW',
        resource: 'prescription',
        metadata: { previousPrescriptionId: id, renewedPrescriptionId: renewed.id, validUntil },
      },
    });

    return renewed;
  }

  // Compatibilidade com endpoints legados
  list(tenantId: string) {
    return this.prescription.findMany({ where: { tenantId }, orderBy: { createdAt: 'desc' } });
  }

  update(tenantId: string, id: string, payload: Record<string, unknown>) {
    return this.prescription.update({ where: { id, tenantId }, data: payload });
  }

  async remove(tenantId: string, id: string) {
    await this.cancel(tenantId, id);
    return { deleted: true };
  }

  async execute(action: string, tenantId: string, actorId: string, payload: Record<string, unknown>) {
    await this.prisma.activityLog.create({
      data: { tenantId, actorId, action, resource: 'prescription', metadata: payload as Prisma.InputJsonValue },
    });
    return { action, tenantId, actorId, status: 'queued', payload };
  }
}
