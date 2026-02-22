import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

import { PaginationDto } from '../../common/dto/pagination.dto';

export class ListConsultationsDto extends PaginationDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  patientId?: string;

  @ApiPropertyOptional({ enum: ['DRAFT', 'FINALIZED'] })
  @IsOptional()
  @IsString()
  status?: 'DRAFT' | 'FINALIZED';
}
