import { ApiProperty } from '@nestjs/swagger';
import { IsObject, IsString } from 'class-validator';

export class CalculateScoreDto {
  @ApiProperty()
  @IsString()
  patientId!: string;

  @ApiProperty()
  @IsString()
  scoreType!: string;

  @ApiProperty({ type: 'object', additionalProperties: true })
  @IsObject()
  parameters!: Record<string, unknown>;
}
