import { PartialType } from '@nestjs/swagger';
import { IsEnum, IsOptional } from 'class-validator';

import { AppointmentStatus, CreateAppointmentDto } from './create-appointment.dto';

export class UpdateAppointmentDto extends PartialType(CreateAppointmentDto) {
  @IsOptional()
  @IsEnum(AppointmentStatus)
  status?: AppointmentStatus;
}
