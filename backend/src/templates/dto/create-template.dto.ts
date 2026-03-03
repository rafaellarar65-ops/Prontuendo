import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsObject, IsOptional, IsString } from 'class-validator';

export class CreateTemplateDto {
  @ApiProperty()
  @IsString()
  name!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ type: Object })
  @IsObject()
  canvasJson!: Record<string, unknown>;
}
