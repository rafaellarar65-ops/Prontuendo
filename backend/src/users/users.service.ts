import { Injectable } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';

import { PaginationDto } from '../common/dto/pagination.dto';
import { PrismaService } from '../prisma/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async create(tenantId: string, actorId: string, dto: CreateUserDto) {
    const passwordHash = await bcrypt.hash(dto.password, 10);

    const user = await this.prisma.user.create({
      data: {
        tenantId,
        email: dto.email.toLowerCase(),
        passwordHash,
        fullName: dto.fullName,
        role: dto.role,
      },
      select: {
        id: true,
        tenantId: true,
        email: true,
        fullName: true,
        role: true,
        isActive: true,
        createdAt: true,
      },
    });

    await this.logMutation(tenantId, actorId, 'CREATE', 'user', { userId: user.id });

    return user;
  }

  async findAll(tenantId: string, pagination: PaginationDto) {
    return this.prisma.user.findMany({
      where: { tenantId },
      skip: (pagination.page - 1) * pagination.perPage,
      take: pagination.perPage,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        email: true,
        fullName: true,
        role: true,
        isActive: true,
        createdAt: true,
      },
    });
  }

  async update(tenantId: string, actorId: string, id: string, dto: UpdateUserDto) {
    const updated = await this.prisma.user.update({
      where: { id_tenantId: { id, tenantId } },
      data: dto,
      select: {
        id: true,
        email: true,
        fullName: true,
        role: true,
        isActive: true,
        updatedAt: true,
      },
    });

    await this.logMutation(tenantId, actorId, 'UPDATE', 'user', { userId: id, fields: Object.keys(dto) });
    return updated;
  }

  async remove(tenantId: string, actorId: string, id: string) {
    await this.prisma.user.delete({ where: { id_tenantId: { id, tenantId } } });
    await this.logMutation(tenantId, actorId, 'DELETE', 'user', { userId: id });

    return { deleted: true };
  }

  private async logMutation(
    tenantId: string,
    actorId: string,
    action: string,
    resource: string,
    metadata: Record<string, unknown>,
  ) {
    await this.prisma.activityLog.create({
      data: { tenantId, actorId, action, resource, metadata: metadata as object },
    });
  }
}
