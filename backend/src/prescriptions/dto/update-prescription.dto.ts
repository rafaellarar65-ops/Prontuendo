import { ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { IsArray, IsOptional, IsString, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

import { CreatePrescriptionDto, PrescriptionItemDto } from './create-prescription.dto';

export class UpdatePrescriptionDto extends PartialType(CreatePrescriptionDto) {
  @ApiPropertyOptional({ enum: ['ATIVA', 'CANCELADA'] })
  @IsOptional()
  @IsString()
  status?: 'ATIVA' | 'CANCELADA';

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PrescriptionItemDto)
  declare items?: PrescriptionItemDto[];
}
