import { ApiProperty } from '@nestjs/swagger';
import { Matches } from 'class-validator';

export class RangeQueryDto {
  @ApiProperty({ example: '2026-01-01' })
  @Matches(/^\d{4}-\d{2}-\d{2}$/, { message: 'start deve estar no formato YYYY-MM-DD' })
  start!: string;

  @ApiProperty({ example: '2026-01-31' })
  @Matches(/^\d{4}-\d{2}-\d{2}$/, { message: 'end deve estar no formato YYYY-MM-DD' })
  end!: string;
}
