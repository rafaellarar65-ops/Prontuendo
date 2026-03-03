import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsOptional, IsString } from 'class-validator';

import { APPOINTMENT_TYPES, AppointmentType } from './appointment.types';

export class CreateAppointmentDto {
  @ApiProperty()
  @IsString()
  patientId!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  patientName?: string;

  @ApiProperty({ example: '2026-03-03' })
  @IsString()
  date!: string;

  @ApiProperty({ example: '09:30' })
  @IsString()
  time!: string;

  @ApiProperty({ enum: APPOINTMENT_TYPES })
  @IsString()
  @IsIn(APPOINTMENT_TYPES)
  type!: AppointmentType;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;
}
