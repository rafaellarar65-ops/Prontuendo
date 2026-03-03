import { ApiProperty } from '@nestjs/swagger';
import { IsNumber } from 'class-validator';

export class BmiDto {
  @ApiProperty()
  @IsNumber()
  weightKg!: number;

  @ApiProperty()
  @IsNumber()
  heightM!: number;
}
