import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsOptional, IsString } from 'class-validator';

export class DuplicatePrescriptionDto {
  @ApiPropertyOptional({ type: String, format: 'date-time' })
  @IsOptional()
  @IsDateString()
  validUntil?: string;
}

export class SearchMedicationDto {
  @ApiPropertyOptional({ description: 'Texto para busca do medicamento' })
  @IsOptional()
  @IsString()
  query?: string;

  @ApiPropertyOptional({ description: 'Nome comercial ou substância ativa' })
  @IsOptional()
  @IsString()
  term?: string;
}

export class SignPrescriptionDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  signatureToken?: string;
}
