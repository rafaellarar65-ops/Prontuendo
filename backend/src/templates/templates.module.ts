import { Module } from '@nestjs/common';

import { PdfEngineModule } from '../pdf-engine/pdf-engine.module';
import { TemplatesController } from './templates.controller';
import { TemplatesService } from './templates.service';
import { VariableResolverService } from './variable-resolver.service';

@Module({
  imports: [PdfEngineModule],
  controllers: [TemplatesController],
  providers: [TemplatesService, VariableResolverService],
  exports: [TemplatesService, VariableResolverService],
})
export class TemplatesModule {}
