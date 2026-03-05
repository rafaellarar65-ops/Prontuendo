import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsObject, IsOptional, IsString, MaxLength } from 'class-validator';

import { ProtocolStatus } from './protocol-status.enum';

export class UpdateProtocolDto {
  @ApiPropertyOptional({ description: 'Nome do protocolo', maxLength: 140 })
  @IsOptional()
  @IsString()
  @MaxLength(140)
  name?: string;

  @ApiPropertyOptional({ description: 'Condição/diagnóstico relacionado ao protocolo' })
  @IsOptional()
  @IsString()
  condition?: string;

  @ApiPropertyOptional({ description: 'Conteúdo estruturado do protocolo' })
  @IsOptional()
  @IsObject()
  content?: Record<string, unknown>;

  @ApiPropertyOptional({ enum: ProtocolStatus })
  @IsOptional()
  @IsEnum(ProtocolStatus)
  status?: ProtocolStatus;
}
