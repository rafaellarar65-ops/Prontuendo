import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';

export class CreateGlucoseLogDto {
  @ApiProperty()
  @IsString()
  patientId!: string;

  @ApiProperty({ example: 123 })
  @IsInt()
  @Min(20)
  @Max(600)
  value!: number;

  @ApiProperty({ format: 'date-time' })
  @IsDateString()
  measuredAt!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;
}
