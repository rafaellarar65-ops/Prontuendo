import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class ProtocolSuggestionsQueryDto {
  @ApiProperty({ description: 'Diagnóstico para sugestão de protocolos' })
  @IsString()
  diagnosis!: string;
}
