import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsEnum, IsOptional, IsString, Matches } from 'class-validator';
import { AppointmentStatus, AppointmentType } from '@prisma/client';

export class UpdateAppointmentDto {
  @ApiPropertyOptional({ description: 'Data do agendamento (YYYY-MM-DD)' })
  @IsOptional()
  @IsDateString()
  date?: string;

  @ApiPropertyOptional({ description: 'Horário (HH:mm)' })
  @IsOptional()
  @Matches(/^([01]\d|2[0-3]):([0-5]\d)$/, { message: 'Horário deve estar no formato HH:mm' })
  time?: string;

  @ApiPropertyOptional({ enum: AppointmentType })
  @IsOptional()
  @IsEnum(AppointmentType)
  type?: AppointmentType;

  @ApiPropertyOptional({ enum: AppointmentStatus })
  @IsOptional()
  @IsEnum(AppointmentStatus)
  status?: AppointmentStatus;

  @ApiPropertyOptional({ description: 'Observações' })
  @IsOptional()
  @IsString()
  notes?: string;
}
