import { Module } from '@nestjs/common';

import { PdfEngineModule } from '../pdf-engine/pdf-engine.module';
import { TemplatesController } from './templates.controller';
import { TemplatesService } from './templates.service';

@Module({
  imports: [PdfEngineModule],
  controllers: [TemplatesController],
  providers: [TemplatesService],
  exports: [TemplatesService],
})
export class TemplatesModule {}
