import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsDateString,
  IsNotEmpty,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';

export class PrescriptionItemDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  drugName!: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  dose!: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  route!: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  frequency!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  duration?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  instructions?: string;

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  isControlled: boolean = false;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  quantity?: string;
}

export class CreatePrescriptionDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  patientId!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  consultationId?: string;

  @ApiProperty({ type: [PrescriptionItemDto] })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => PrescriptionItemDto)
  items!: PrescriptionItemDto[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  validUntil?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  signature?: string;
}
