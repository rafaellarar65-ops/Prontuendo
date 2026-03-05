import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString } from 'class-validator';

import { PaginationDto } from '../../common/dto/pagination.dto';
import { ProtocolStatus } from './protocol-status.enum';

export class ListProtocolsDto extends PaginationDto {
  @ApiPropertyOptional({ description: 'Filtro por condição/diagnóstico' })
  @IsOptional()
  @IsString()
  condition?: string;

  @ApiPropertyOptional({ enum: ProtocolStatus, description: 'Filtro por status do protocolo' })
  @IsOptional()
  @IsEnum(ProtocolStatus)
  status?: ProtocolStatus;
}
