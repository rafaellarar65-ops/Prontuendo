import { Module } from '@nestjs/common';

import { TemplatesController } from './templates.controller';
import { TemplatesService } from './templates.service';
import { VariableResolverService } from './variable-resolver.service';

@Module({
  controllers: [TemplatesController],
  providers: [TemplatesService, VariableResolverService],
  exports: [TemplatesService, VariableResolverService],
})
export class TemplatesModule {}
