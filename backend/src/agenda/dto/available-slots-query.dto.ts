import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsInt, IsString, Matches, Min } from 'class-validator';

export class AvailableSlotsQueryDto {
  @ApiProperty()
  @IsString()
  clinicianId!: string;

  @ApiProperty({ example: '2026-01-15' })
  @Matches(/^\d{4}-\d{2}-\d{2}$/, { message: 'date deve estar no formato YYYY-MM-DD' })
  date!: string;

  @ApiProperty({ example: 30 })
  @Transform(({ value }) => Number(value))
  @IsInt({ message: 'durationMin deve ser um inteiro' })
  @Min(1, { message: 'durationMin deve ser maior que zero' })
  durationMin!: number;
}
