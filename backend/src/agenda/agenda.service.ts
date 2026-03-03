import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateAppointmentDto, UpdateAppointmentDto } from './dto';

@Injectable()
export class AgendaService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Lista agendamentos de um tenant, opcionalmente filtrando por data
   */
  async list(tenantId: string, date?: string) {
    const where: Prisma.AppointmentWhereInput = { tenantId };

    if (date) {
      // Filtra pela data específica
      const targetDate = new Date(date);
      where.date = targetDate;
    }

    const appointments = await this.prisma.appointment.findMany({
      where,
      include: {
        patient: {
          select: { id: true, fullName: true },
        },
      },
      orderBy: [{ date: 'asc' }, { time: 'asc' }],
    });

    // Mapeia para incluir patientName no retorno
    return appointments.map((appt) => ({
      id: appt.id,
      patientId: appt.patientId,
      patientName: appt.patient.fullName,
      date: appt.date.toISOString().split('T')[0],
      time: appt.time,
      type: appt.type,
      status: appt.status,
      notes: appt.notes,
      createdAt: appt.createdAt,
      updatedAt: appt.updatedAt,
    }));
  }

  /**
   * Busca um agendamento por ID
   */
  async findOne(tenantId: string, id: string) {
    const appointment = await this.prisma.appointment.findFirst({
      where: { id, tenantId },
      include: {
        patient: {
          select: { id: true, fullName: true },
        },
      },
    });

    if (!appointment) {
      throw new NotFoundException('Agendamento não encontrado');
    }

    return {
      id: appointment.id,
      patientId: appointment.patientId,
      patientName: appointment.patient.fullName,
      date: appointment.date.toISOString().split('T')[0],
      time: appointment.time,
      type: appointment.type,
      status: appointment.status,
      notes: appointment.notes,
      createdAt: appointment.createdAt,
      updatedAt: appointment.updatedAt,
    };
  }

  /**
   * Cria um novo agendamento
   */
  async create(tenantId: string, clinicianId: string, dto: CreateAppointmentDto) {
    // Verifica se o paciente existe e pertence ao tenant
    const patient = await this.prisma.patient.findFirst({
      where: { id: dto.patientId, tenantId },
    });

    if (!patient) {
      throw new NotFoundException('Paciente não encontrado');
    }

    const appointment = await this.prisma.appointment.create({
      data: {
        tenantId,
        patientId: dto.patientId,
        clinicianId,
        date: new Date(dto.date),
        time: dto.time,
        type: dto.type,
        notes: dto.notes,
      },
      include: {
        patient: {
          select: { id: true, fullName: true },
        },
      },
    });

    return {
      id: appointment.id,
      patientId: appointment.patientId,
      patientName: appointment.patient.fullName,
      date: appointment.date.toISOString().split('T')[0],
      time: appointment.time,
      type: appointment.type,
      status: appointment.status,
      notes: appointment.notes,
      createdAt: appointment.createdAt,
      updatedAt: appointment.updatedAt,
    };
  }

  /**
   * Atualiza um agendamento existente
   */
  async update(tenantId: string, id: string, dto: UpdateAppointmentDto) {
    // Verifica se existe
    const existing = await this.prisma.appointment.findFirst({
      where: { id, tenantId },
    });

    if (!existing) {
      throw new NotFoundException('Agendamento não encontrado');
    }

    const updateData: Prisma.AppointmentUpdateInput = {};

    if (dto.date !== undefined) {
      updateData.date = new Date(dto.date);
    }
    if (dto.time !== undefined) {
      updateData.time = dto.time;
    }
    if (dto.type !== undefined) {
      updateData.type = dto.type;
    }
    if (dto.status !== undefined) {
      updateData.status = dto.status;
    }
    if (dto.notes !== undefined) {
      updateData.notes = dto.notes;
    }

    const appointment = await this.prisma.appointment.update({
      where: { id },
      data: updateData,
      include: {
        patient: {
          select: { id: true, fullName: true },
        },
      },
    });

    return {
      id: appointment.id,
      patientId: appointment.patientId,
      patientName: appointment.patient.fullName,
      date: appointment.date.toISOString().split('T')[0],
      time: appointment.time,
      type: appointment.type,
      status: appointment.status,
      notes: appointment.notes,
      createdAt: appointment.createdAt,
      updatedAt: appointment.updatedAt,
    };
  }

  /**
   * Remove um agendamento
   */
  async remove(tenantId: string, id: string) {
    const existing = await this.prisma.appointment.findFirst({
      where: { id, tenantId },
    });

    if (!existing) {
      throw new NotFoundException('Agendamento não encontrado');
    }

    await this.prisma.appointment.delete({
      where: { id },
    });

    return { deleted: true };
  }

  /**
   * Lista agendamentos de um paciente específico
   */
  async listByPatient(tenantId: string, patientId: string) {
    const appointments = await this.prisma.appointment.findMany({
      where: { tenantId, patientId },
      include: {
        patient: {
          select: { id: true, fullName: true },
        },
      },
      orderBy: [{ date: 'desc' }, { time: 'desc' }],
    });

    return appointments.map((appt) => ({
      id: appt.id,
      patientId: appt.patientId,
      patientName: appt.patient.fullName,
      date: appt.date.toISOString().split('T')[0],
      time: appt.time,
      type: appt.type,
      status: appt.status,
      notes: appt.notes,
      createdAt: appt.createdAt,
      updatedAt: appt.updatedAt,
    }));
  }
}
