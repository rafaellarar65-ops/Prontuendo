import { Module } from '@nestjs/common';

import { DrugTemplatesController } from './drug-templates.controller';
import { DrugTemplatesService } from './drug-templates.service';
import { PrescriptionsController } from './prescriptions.controller';
import { PrescriptionsService } from './prescriptions.service';

@Module({
  controllers: [PrescriptionsController, DrugTemplatesController],
  providers: [PrescriptionsService, DrugTemplatesService],
  exports: [PrescriptionsService, DrugTemplatesService],
})
export class PrescriptionsModule {}
