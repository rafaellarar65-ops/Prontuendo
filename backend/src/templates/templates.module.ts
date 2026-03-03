import { Module } from '@nestjs/common';

import { PdfEngineModule } from '../pdf-engine/pdf-engine.module';
import { VariableResolverService } from '../variable-resolver/variable-resolver.service';
import { TemplatesController } from './templates.controller';
import { TemplatesService } from './templates.service';

@Module({
  imports: [PdfEngineModule],
  controllers: [TemplatesController],
  providers: [TemplatesService, VariableResolverService],
  exports: [TemplatesService],
})
export class TemplatesModule {}
