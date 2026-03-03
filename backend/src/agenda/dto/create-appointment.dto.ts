import { IsDateString, IsEnum, IsNotEmpty, IsNumber, IsOptional, IsString, Max, MaxLength, Min } from 'class-validator';

export enum AppointmentType {
  FIRST_CONSULTATION = 'FIRST_CONSULTATION',
  FOLLOW_UP = 'FOLLOW_UP',
  RETURN = 'RETURN',
  PROCEDURE = 'PROCEDURE',
  EXAM = 'EXAM',
  OTHER = 'OTHER',
}

export enum AppointmentStatus {
  SCHEDULED = 'SCHEDULED',
  CONFIRMED = 'CONFIRMED',
  WAITING = 'WAITING',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  CANCELED = 'CANCELED',
  NO_SHOW = 'NO_SHOW',
}

export class CreateAppointmentDto {
  @IsString()
  @IsNotEmpty()
  patientId!: string;

  @IsString()
  @IsNotEmpty()
  clinicianId!: string;

  @IsEnum(AppointmentType)
  type!: AppointmentType;

  @IsDateString()
  scheduledAt!: string;

  @IsOptional()
  @IsNumber()
  @Min(10)
  @Max(120)
  durationMin?: number;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  notes?: string;

  @IsOptional()
  @IsString()
  returnFromConsultationId?: string;
}
