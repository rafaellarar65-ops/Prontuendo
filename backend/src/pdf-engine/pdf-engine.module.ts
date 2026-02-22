import { Module } from '@nestjs/common';

import { PdfEngineController } from './pdf-engine.controller';
import { PdfEngineService } from './pdf-engine.service';

@Module({
  controllers: [PdfEngineController],
  providers: [PdfEngineService],
  exports: [PdfEngineService],
})
export class PdfEngineModule {}
