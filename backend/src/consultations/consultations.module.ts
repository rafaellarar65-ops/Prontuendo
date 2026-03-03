import { Module } from '@nestjs/common';

import { ConsultationsController } from './consultations.controller';
import { ConsultationsService } from './consultations.service';
import { SoapPdfService } from './soap-pdf.service';

@Module({
  controllers: [ConsultationsController],
  providers: [ConsultationsService, SoapPdfService],
  exports: [ConsultationsService],
})
export class ConsultationsModule {}
