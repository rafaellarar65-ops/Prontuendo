import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePrescriptionDto } from './dto/create-prescription.dto';
import { ListPrescriptionsDto } from './dto/list-prescriptions.dto';
import { UpdatePrescriptionDto } from './dto/update-prescription.dto';

type PrescriptionStatus = 'ATIVA' | 'CANCELADA';

type PrescriptionRecord = {
  id: string;
  tenantId: string;
  patientId: string;
  clinicianId: string;
  consultationId?: string | null;
  issuedAt?: Date;
  validUntil?: Date | null;
  notes?: string | null;
  status: PrescriptionStatus;
  items?: Array<Record<string, unknown>>;
};

type PrescriptionDelegate = {
  create(args: Record<string, unknown>): Promise<PrescriptionRecord>;
  findMany(args: Record<string, unknown>): Promise<PrescriptionRecord[]>;
  findFirst(args: Record<string, unknown>): Promise<PrescriptionRecord | null>;
  update(args: Record<string, unknown>): Promise<PrescriptionRecord>;
};

type PrescriptionItemDelegate = {
  deleteMany(args: Record<string, unknown>): Promise<{ count: number }>;
};

type MedicationDelegate = {
  findMany(args: Record<string, unknown>): Promise<Array<Record<string, unknown>>>;
};

type PrismaTransaction = {
  prescription: PrescriptionDelegate;
  prescriptionItem: PrescriptionItemDelegate;
  activityLog: {
    create(args: Record<string, unknown>): Promise<unknown>;
  };
};

@Injectable()
export class PrescriptionsService {
  constructor(private readonly prisma: PrismaService) {}

  private get prescription(): PrescriptionDelegate {
    return (this.prisma as unknown as { prescription: PrescriptionDelegate }).prescription;
  }

  private get medication(): MedicationDelegate {
    return (this.prisma as unknown as { medication: MedicationDelegate }).medication;
  }

  async create(tenantId: string, clinicianId: string, dto: CreatePrescriptionDto) {
    return this.prisma.$transaction(async (trx) => {
      const client = trx as unknown as PrismaTransaction;

      const prescription = await client.prescription.create({
        data: {
          tenantId,
          clinicianId,
          patientId: dto.patientId,
          consultationId: dto.consultationId ?? null,
          issuedAt: dto.issuedAt ? new Date(dto.issuedAt) : new Date(),
          validUntil: dto.validUntil ? new Date(dto.validUntil) : null,
          status: 'ATIVA',
          notes: dto.notes ?? null,
          items: {
            createMany: {
              data: dto.items,
            },
          },
        },
        include: { items: true },
      });

      await client.activityLog.create({
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
    });
  }

  findAll(tenantId: string, query: ListPrescriptionsDto) {
    const where: Record<string, unknown> = {
      tenantId,
      patientId: query.patientId,
      status: query.status,
    };

    return this.prescription.findMany({
      where,
      include: { items: true },
      skip: (query.page - 1) * query.perPage,
      take: query.perPage,
      orderBy: { issuedAt: 'desc' },
    });
  }

  async findById(tenantId: string, id: string) {
    const prescription = await this.prescription.findFirst({
      where: { id, tenantId },
      include: { items: true },
    });

    if (!prescription) {
      throw new NotFoundException('Prescrição não encontrada');
    }

    return prescription;
  }

  async update(tenantId: string, id: string, dto: UpdatePrescriptionDto) {
    const current = await this.findById(tenantId, id);

    return this.prisma.$transaction(async (trx) => {
      const client = trx as unknown as PrismaTransaction;

      if (dto.items) {
        await client.prescriptionItem.deleteMany({ where: { prescriptionId: id } });
      }

      const updated = await client.prescription.update({
        where: { id },
        data: {
          patientId: dto.patientId,
          consultationId: dto.consultationId,
          issuedAt: dto.issuedAt ? new Date(dto.issuedAt) : undefined,
          validUntil: dto.validUntil ? new Date(dto.validUntil) : dto.validUntil,
          notes: dto.notes,
          status: dto.status,
          ...(dto.items
            ? {
                items: {
                  createMany: {
                    data: dto.items,
                  },
                },
              }
            : {}),
        },
        include: { items: true },
      });

      await client.activityLog.create({
        data: {
          tenantId,
          actorId: current.clinicianId,
          action: 'UPDATE',
          resource: 'prescription',
          metadata: { prescriptionId: id },
        },
      });

      return updated;
    });
  }

  async cancel(tenantId: string, id: string) {
    const current = await this.findById(tenantId, id);

    return this.prisma.$transaction(async (trx) => {
      const client = trx as unknown as PrismaTransaction;

      const canceled = await client.prescription.update({
        where: { id },
        data: { status: 'CANCELADA' },
        include: { items: true },
      });

      await client.activityLog.create({
        data: {
          tenantId,
          actorId: current.clinicianId,
          action: 'CANCEL',
          resource: 'prescription',
          metadata: { prescriptionId: id, previousStatus: current.status, nextStatus: 'CANCELADA' },
        },
      });

      return canceled;
    });
  }

  async duplicate(tenantId: string, clinicianId: string, id: string) {
    const source = await this.findById(tenantId, id);

    return this.prisma.$transaction(async (trx) => {
      const client = trx as unknown as PrismaTransaction;

      const duplicated = await client.prescription.create({
        data: {
          tenantId,
          clinicianId,
          patientId: source.patientId,
          consultationId: source.consultationId ?? null,
          issuedAt: new Date(),
          validUntil: null,
          status: 'ATIVA',
          notes: source.notes ?? null,
          items: {
            createMany: {
              data: source.items ?? [],
            },
          },
        },
        include: { items: true },
      });

      await client.activityLog.create({
        data: {
          tenantId,
          actorId: clinicianId,
          action: 'DUPLICATE',
          resource: 'prescription',
          metadata: { sourcePrescriptionId: id, duplicatedPrescriptionId: duplicated.id },
        },
      });

      return duplicated;
    });
  }

  searchMedication(tenantId: string, query: string) {
    return this.medication.findMany({
      where: {
        tenantId,
        name: { contains: query, mode: 'insensitive' },
      },
      take: 20,
      orderBy: { name: 'asc' },
    });
  }

  async remove(tenantId: string, id: string) {
    await this.cancel(tenantId, id);
    return { deleted: true };
  }
}
