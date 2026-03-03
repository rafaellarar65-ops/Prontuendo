import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsArray, IsDateString, IsIn, IsOptional, IsString } from 'class-validator';

class PrescriptionItemDto {
  @ApiProperty()
  @IsString()
  medication!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  dosage?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  instructions?: string;
}

export class CreatePrescriptionDto {
  @ApiProperty()
  @IsString()
  patientId!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  consultationId?: string;

  @ApiPropertyOptional({ type: String, format: 'date-time' })
  @IsOptional()
  @IsDateString()
  issuedAt?: string;

  @ApiPropertyOptional({ type: String, format: 'date-time' })
  @IsOptional()
  @IsDateString()
  validUntil?: string;

  @ApiPropertyOptional({ enum: ['ATIVA', 'CANCELADA'], default: 'ATIVA' })
  @IsOptional()
  @IsIn(['ATIVA', 'CANCELADA'])
  status?: 'ATIVA' | 'CANCELADA';

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiPropertyOptional({ type: [PrescriptionItemDto], default: [] })
  @IsOptional()
  @IsArray()
  @Type(() => PrescriptionItemDto)
  items?: PrescriptionItemDto[];
}
