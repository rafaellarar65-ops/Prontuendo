import { ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { IsIn, IsOptional, IsString } from 'class-validator';

import { CreateAppointmentDto } from './create-appointment.dto';
import { APPOINTMENT_STATUS, AppointmentStatus } from './appointment.types';

export class UpdateAppointmentDto extends PartialType(CreateAppointmentDto) {
  @ApiPropertyOptional({ enum: APPOINTMENT_STATUS })
  @IsOptional()
  @IsString()
  @IsIn(APPOINTMENT_STATUS)
  status?: AppointmentStatus;
}
