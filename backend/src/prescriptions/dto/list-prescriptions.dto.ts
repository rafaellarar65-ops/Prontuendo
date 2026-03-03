import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsOptional, IsString } from 'class-validator';

import { PaginationDto } from '../../common/dto/pagination.dto';

export class ListPrescriptionsDto extends PaginationDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  patientId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  consultationId?: string;

  @ApiPropertyOptional({ enum: ['ATIVA', 'CANCELADA'] })
  @IsOptional()
  @IsIn(['ATIVA', 'CANCELADA'])
  status?: 'ATIVA' | 'CANCELADA';
}
