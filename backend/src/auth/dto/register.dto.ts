import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsEnum, IsOptional, IsString, MinLength } from 'class-validator';

import { RoleEnum } from '../../common/enums/role.enum';

export class RegisterDto {
  @ApiProperty({ example: 'medico@clinica.com' })
  @IsEmail()
  email!: string;

  @ApiProperty({ example: 'StrongPass!123' })
  @IsString()
  @MinLength(8)
  password!: string;

  @ApiProperty({ example: 'Dr. Lucas Andrade' })
  @IsString()
  fullName!: string;

  @ApiProperty({ enum: RoleEnum, example: RoleEnum.MEDICO })
  @IsEnum(RoleEnum)
  role!: RoleEnum;

  @ApiProperty({ required: false, example: 'cuid_patient' })
  @IsOptional()
  @IsString()
  patientLinkId?: string;
}
