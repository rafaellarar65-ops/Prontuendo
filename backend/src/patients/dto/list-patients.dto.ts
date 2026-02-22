import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

import { PaginationDto } from '../../common/dto/pagination.dto';

export class ListPatientsDto extends PaginationDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  q?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  lifecycle?: string;

  @ApiPropertyOptional({ description: 'Tag única para filtro' })
  @IsOptional()
  @IsString()
  tag?: string;
}
