import { ApiProperty } from '@nestjs/swagger';
import { IsObject } from 'class-validator';

export class GenericPayloadDto {
  @ApiProperty({ type: 'object', additionalProperties: true })
  @IsObject()
  payload!: Record<string, unknown>;
}
