import { ApiProperty } from '@nestjs/swagger';
import { IsNumber } from 'class-validator';

export class HomaIrDto {
  @ApiProperty()
  @IsNumber()
  fastingGlucose!: number;

  @ApiProperty()
  @IsNumber()
  fastingInsulin!: number;
}
