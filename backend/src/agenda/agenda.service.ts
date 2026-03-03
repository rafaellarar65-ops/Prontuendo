import { Injectable } from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service';

type AppointmentStatus = 'AGENDADO' | 'CONFIRMADO' | 'REALIZADO' | 'CANCELADO' | string;
type AppointmentInput = Record<string, unknown>;

type AppointmentDelegate = {
  create: (args: Record<string, unknown>) => Promise<unknown>;
  findMany: (args: Record<string, unknown>) => Promise<unknown[]>;
  findFirst: (args: Record<string, unknown>) => Promise<Record<string, unknown> | null>;
  update: (args: Record<string, unknown>) => Promise<unknown>;
};

type ActivityLogDelegate = {
  create: (args: Record<string, unknown>) => Promise<unknown>;
};

@Injectable()
export class AgendaService {
  constructor(private readonly prisma: PrismaService) {}

  private get appointment(): AppointmentDelegate {
    return (this.prisma as unknown as { appointment: AppointmentDelegate }).appointment;
  }

  private get activityLog(): ActivityLogDelegate {
    return (this.prisma as unknown as { activityLog: ActivityLogDelegate }).activityLog;
  }

  list(tenantId: string) {
    return this.appointment.findMany({
      where: { tenantId },
      orderBy: { startsAt: 'desc' },
      take: 50,
    });
  }

  async create(tenantId: string, dto: AppointmentInput) {
    const appointment = await this.appointment.create({
      data: { ...dto, tenantId },
    });

    await this.activityLog.create({
      data: {
        tenantId,
        actorId: (dto.actorId as string | undefined) ?? 'SYSTEM',
        action: 'APPOINTMENT_CREATED',
        resource: 'APPOINTMENT',
        metadata: {
          appointmentId: (appointment as { id?: string }).id,
        },
      },
    });

    return appointment;
  }

  findByDate(tenantId: string, date: string | Date) {
    const ref = new Date(date);
    const start = new Date(Date.UTC(ref.getUTCFullYear(), ref.getUTCMonth(), ref.getUTCDate(), 0, 0, 0, 0));
    const end = new Date(Date.UTC(ref.getUTCFullYear(), ref.getUTCMonth(), ref.getUTCDate(), 23, 59, 59, 999));

    return this.appointment.findMany({
      where: {
        tenantId,
        startsAt: {
          gte: start,
          lte: end,
        },
      },
      orderBy: { startsAt: 'asc' },
      include: {
        patient: { select: { fullName: true } },
        clinician: { select: { fullName: true } },
      },
    });
  }

  findByPatient(tenantId: string, patientId: string) {
    return this.appointment.findMany({
      where: { tenantId, patientId },
      orderBy: { startsAt: 'desc' },
      take: 50,
    });
  }

  findByRange(tenantId: string, start: string | Date, end: string | Date) {
    return this.appointment.findMany({
      where: {
        tenantId,
        startsAt: {
          gte: new Date(start),
          lte: new Date(end),
        },
      },
      orderBy: { startsAt: 'asc' },
      include: {
        patient: true,
        clinician: true,
      },
    });
  }

  async update(tenantId: string, id: string, dto: AppointmentInput) {
    const previous = await this.appointment.findFirst({
      where: { tenantId, id },
      select: { id: true, status: true },
    });

    if (!previous) {
      return null;
    }

    const updated = await this.appointment.update({
      where: { id },
      data: dto,
    });

    await this.activityLog.create({
      data: {
        tenantId,
        actorId: (dto.actorId as string | undefined) ?? 'SYSTEM',
        action: 'APPOINTMENT_UPDATED',
        resource: 'APPOINTMENT',
        metadata: {
          appointmentId: id,
          previousStatus: previous.status,
          newStatus: (dto.status as AppointmentStatus | undefined) ?? previous.status,
        },
      },
    });

    return updated;
  }

  remove(tenantId: string, id: string) {
    return this.appointment.update({
      where: { id },
      data: {
        status: 'CANCELADO',
        tenantId,
      },
    });
  }

  async findAvailableSlots(tenantId: string, clinicianId: string, date: string | Date, durationMin = 30) {
    const ref = new Date(date);
    const dayStart = new Date(Date.UTC(ref.getUTCFullYear(), ref.getUTCMonth(), ref.getUTCDate(), 8, 0, 0, 0));
    const dayEnd = new Date(Date.UTC(ref.getUTCFullYear(), ref.getUTCMonth(), ref.getUTCDate(), 18, 0, 0, 0));

    const existingAppointments = (await this.appointment.findMany({
      where: {
        tenantId,
        clinicianId,
        startsAt: {
          gte: dayStart,
          lt: dayEnd,
        },
        status: { not: 'CANCELADO' },
      },
      orderBy: { startsAt: 'asc' },
      select: { startsAt: true, endsAt: true },
    })) as Array<{ startsAt: Date | string; endsAt: Date | string }>;

    const slots: Array<{ startsAt: Date; endsAt: Date }> = [];
    for (let cursor = new Date(dayStart); cursor < dayEnd; cursor = new Date(cursor.getTime() + durationMin * 60 * 1000)) {
      const slotStart = new Date(cursor);
      const slotEnd = new Date(slotStart.getTime() + durationMin * 60 * 1000);
      if (slotEnd > dayEnd) {
        break;
      }

      const hasCollision = existingAppointments.some((appointment) => {
        const busyStart = new Date(appointment.startsAt as string | Date);
        const busyEnd = new Date(appointment.endsAt as string | Date);
        return slotStart < busyEnd && slotEnd > busyStart;
      });

      if (!hasCollision) {
        slots.push({ startsAt: slotStart, endsAt: slotEnd });
      }
    }

    return slots;
  }
}
