import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsDateString, IsEnum, IsOptional, IsString } from 'class-validator';

import { AppointmentType } from './appointment.enums';

export class CreateAppointmentDto {
  @ApiProperty()
  @IsString()
  patientId!: string;

  @ApiProperty({ type: String, format: 'date' })
  @IsDateString()
  date!: string;

  @ApiProperty({ description: 'Horário inicial. Também aceita o campo `time` do frontend.' })
  @Transform(({ value, obj }) => value ?? obj.time)
  @IsString()
  startTime!: string;

  @ApiProperty({ enum: AppointmentType })
  @IsEnum(AppointmentType)
  type!: AppointmentType;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  endTime?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  serviceId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  roomId?: string;
}
