import { ApiProperty } from '@nestjs/swagger';
import { IsIn, IsInt, IsNumber } from 'class-validator';

export class CkdEpiDto {
  @ApiProperty({ enum: ['male', 'female'] })
  @IsIn(['male', 'female'])
  sex!: 'male' | 'female';

  @ApiProperty()
  @IsInt()
  age!: number;

  @ApiProperty({ description: 'Creatinina sérica (mg/dL)' })
  @IsNumber()
  creatinine!: number;
}
