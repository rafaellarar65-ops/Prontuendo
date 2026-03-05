import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsObject, IsOptional, IsString, MaxLength } from 'class-validator';

import { ProtocolStatus } from './protocol-status.enum';

export class CreateProtocolDto {
  @ApiProperty({ description: 'Nome do protocolo', maxLength: 140 })
  @IsString()
  @MaxLength(140)
  name!: string;

  @ApiProperty({ description: 'Condição/diagnóstico relacionado ao protocolo' })
  @IsString()
  condition!: string;

  @ApiPropertyOptional({ description: 'Conteúdo estruturado do protocolo' })
  @IsOptional()
  @IsObject()
  content?: Record<string, unknown>;

  @ApiPropertyOptional({ enum: ProtocolStatus, default: ProtocolStatus.ACTIVE })
  @IsOptional()
  @IsEnum(ProtocolStatus)
  status?: ProtocolStatus;
}
