import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class RenderTemplateDto {
  @ApiProperty()
  @IsString()
  patientId!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  consultationId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  clinicianId?: string;
}
