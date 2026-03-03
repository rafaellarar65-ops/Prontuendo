import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsOptional, IsString, Matches, Min } from 'class-validator';

export class CreateAgendaDto {
  @ApiProperty()
  @IsString()
  patientId!: string;

  @ApiProperty()
  @IsString()
  clinicianId!: string;

  @ApiProperty({ example: '2026-01-15' })
  @Matches(/^\d{4}-\d{2}-\d{2}$/, { message: 'date deve estar no formato YYYY-MM-DD' })
  date!: string;

  @ApiProperty({ example: '09:00' })
  @Matches(/^([01]\d|2[0-3]):([0-5]\d)$/, { message: 'start deve estar no formato HH:mm' })
  start!: string;

  @ApiProperty({ example: '09:30' })
  @Matches(/^([01]\d|2[0-3]):([0-5]\d)$/, { message: 'end deve estar no formato HH:mm' })
  end!: string;

  @ApiProperty({ example: 30 })
  @IsInt({ message: 'durationMin deve ser um inteiro' })
  @Min(1, { message: 'durationMin deve ser maior que zero' })
  durationMin!: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;
}
