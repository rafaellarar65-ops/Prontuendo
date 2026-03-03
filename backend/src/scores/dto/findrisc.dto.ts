import { ApiProperty } from '@nestjs/swagger';
import { IsInt } from 'class-validator';

export class FindriscDto {
  @ApiProperty({ description: 'Pergunta 1: faixa etária (pontuação)' })
  @IsInt()
  ageScore!: number;

  @ApiProperty({ description: 'Pergunta 2: IMC (pontuação)' })
  @IsInt()
  bmiScore!: number;

  @ApiProperty({ description: 'Pergunta 3: circunferência abdominal (pontuação)' })
  @IsInt()
  waistScore!: number;

  @ApiProperty({ description: 'Pergunta 4: atividade física (pontuação)' })
  @IsInt()
  physicalActivityScore!: number;

  @ApiProperty({ description: 'Pergunta 5: consumo de frutas/vegetais (pontuação)' })
  @IsInt()
  fruitsVegetablesScore!: number;

  @ApiProperty({ description: 'Pergunta 6: uso de anti-hipertensivos (pontuação)' })
  @IsInt()
  antiHypertensiveScore!: number;

  @ApiProperty({ description: 'Pergunta 7: histórico de glicemia elevada (pontuação)' })
  @IsInt()
  highGlucoseHistoryScore!: number;

  @ApiProperty({ description: 'Pergunta 8: histórico familiar de diabetes (pontuação)' })
  @IsInt()
  familyHistoryScore!: number;
}
