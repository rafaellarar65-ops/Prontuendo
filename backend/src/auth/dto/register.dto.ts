import { ApiProperty } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { IsEmail, IsEnum, IsOptional, IsString, MinLength } from 'class-validator';

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

  @ApiProperty({ enum: Role, example: Role.MEDICO })
  @IsEnum(Role)
  role!: Role;

  @ApiProperty({ required: false, example: 'cuid_patient' })
  @IsOptional()
  @IsString()
  patientLinkId?: string;
}
