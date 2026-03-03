import { ApiProperty } from '@nestjs/swagger';
import { Matches } from 'class-validator';

export class DateQueryDto {
  @ApiProperty({ example: '2026-01-15' })
  @Matches(/^\d{4}-\d{2}-\d{2}$/, { message: 'date deve estar no formato YYYY-MM-DD' })
  date!: string;
}
