import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsArray, IsOptional, IsString, IsUUID } from 'class-validator';

export class UploadDocumentDto {
  @ApiProperty({ description: 'ID do paciente' })
  @IsUUID()
  patientId!: string;

  @ApiProperty({ description: 'Categoria do documento' })
  @IsString()
  category!: string;

  @ApiPropertyOptional({ description: 'Descrição opcional do documento' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ description: 'ID da consulta relacionada' })
  @IsOptional()
  @IsUUID()
  consultationId?: string;

  @ApiPropertyOptional({ description: 'Tags do documento', type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];
}
