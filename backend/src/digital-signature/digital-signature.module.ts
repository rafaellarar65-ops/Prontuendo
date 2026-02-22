import { Module } from '@nestjs/common';

import { DigitalSignatureController } from './digital-signature.controller';
import { DigitalSignatureService } from './digital-signature.service';

@Module({
  controllers: [DigitalSignatureController],
  providers: [DigitalSignatureService],
  exports: [DigitalSignatureService],
})
export class DigitalSignatureModule {}
