import { ApiProperty } from '@nestjs/swagger';
import { IsIn, IsInt, IsNumber } from 'class-validator';

export class BmrDto {
  @ApiProperty({ enum: ['male', 'female'] })
  @IsIn(['male', 'female'])
  sex!: 'male' | 'female';

  @ApiProperty()
  @IsInt()
  age!: number;

  @ApiProperty()
  @IsNumber()
  weightKg!: number;

  @ApiProperty()
  @IsNumber()
  heightCm!: number;
}
