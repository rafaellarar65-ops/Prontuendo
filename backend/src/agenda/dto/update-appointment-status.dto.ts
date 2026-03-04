import { ApiProperty } from '@nestjs/swagger';
import { IsIn, IsString } from 'class-validator';

import { APPOINTMENT_STATUS, AppointmentStatus } from './appointment.types';

export class UpdateAppointmentStatusDto {
  @ApiProperty({ enum: APPOINTMENT_STATUS })
  @IsString()
  @IsIn(APPOINTMENT_STATUS)
  status!: AppointmentStatus;
}
