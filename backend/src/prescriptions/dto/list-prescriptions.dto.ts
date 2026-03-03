import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

import { PaginationDto } from '../../common/dto/pagination.dto';

export class ListPrescriptionsDto extends PaginationDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  patientId?: string;

  @ApiPropertyOptional({ enum: ['ATIVA', 'CANCELADA'] })
  @IsOptional()
  @IsString()
  status?: 'ATIVA' | 'CANCELADA';
}
