import { Module } from '@nestjs/common';

import { AiController } from './ai.controller';
import { AiService } from './ai.service';
import { ClinicalContextService } from './clinical-context.service';

@Module({
  controllers: [AiController],
  providers: [AiService, ClinicalContextService],
  exports: [AiService, ClinicalContextService],
})
export class AiModule {}
