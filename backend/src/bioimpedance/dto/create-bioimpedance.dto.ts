import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsNumber, IsOptional, IsString } from 'class-validator';

export class CreateBioimpedanceDto {
  @ApiProperty()
  @IsString()
  patientId!: string;

  @ApiProperty({ format: 'date-time' })
  @IsDateString()
  measuredAt!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  weightKg?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  bodyFatPct?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  muscleMassKg?: number;
}
