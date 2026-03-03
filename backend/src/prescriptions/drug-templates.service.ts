import { Injectable } from '@nestjs/common';

import { PrescriptionsService } from './prescriptions.service';

@Injectable()
export class DrugTemplatesService {
  constructor(private readonly prescriptionsService: PrescriptionsService) {}

  list(tenantId: string, drugClass?: string) {
    return this.prescriptionsService.execute('drug-templates:list', tenantId, 'system', { class: drugClass });
  }

  create(tenantId: string, actorId: string, payload: Record<string, unknown>) {
    return this.prescriptionsService.execute('drug-templates:create', tenantId, actorId, payload);
  }
}
