import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsEnum, IsNotEmpty, IsOptional, IsString, Matches } from 'class-validator';
import { AppointmentType } from '@prisma/client';

export class CreateAppointmentDto {
  @ApiProperty({ description: 'ID do paciente' })
  @IsNotEmpty()
  @IsString()
  patientId: string;

  @ApiProperty({ description: 'Data do agendamento (YYYY-MM-DD)', example: '2026-03-15' })
  @IsDateString()
  date: string;

  @ApiProperty({ description: 'Horário (HH:mm)', example: '09:30' })
  @IsNotEmpty()
  @Matches(/^([01]\d|2[0-3]):([0-5]\d)$/, { message: 'Horário deve estar no formato HH:mm' })
  time: string;

  @ApiProperty({ enum: AppointmentType, default: AppointmentType.RETORNO })
  @IsEnum(AppointmentType)
  type: AppointmentType;

  @ApiPropertyOptional({ description: 'Observações' })
  @IsOptional()
  @IsString()
  notes?: string;
}
