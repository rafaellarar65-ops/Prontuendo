import { Injectable } from '@nestjs/common';

import { toPrismaJson } from '../common/utils/prisma-json.util';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AiService {
  constructor(private readonly prisma: PrismaService) {}

  async proxy(operation: string, tenantId: string, actorId: string, payload: Record<string, unknown>) {
    await this.prisma.activityLog.create({
      data: {
        tenantId,
        actorId,
        action: 'AI_PROXY',
        resource: operation,
        metadata: toPrismaJson(payload),
      },
    });

    return {
      provider: 'proxy',
      operation,
      status: 'queued',
      tenantId,
    };
  }
}
