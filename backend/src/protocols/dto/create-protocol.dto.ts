import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsInt,
  IsNotEmpty,
  IsObject,
  IsOptional,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator';

export class ProtocolMedicationDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  name!: string;

  @ApiProperty({ example: '500mg-1g/dia' })
  @IsString()
  @IsNotEmpty()
  dosageRange!: string;

  @ApiProperty({ example: 'VO' })
  @IsString()
  @IsNotEmpty()
  route!: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  notes?: string;
}

export class ProtocolStepDto {
  @ApiProperty({ minimum: 1 })
  @IsInt()
  @Min(1)
  order!: number;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  title!: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  description!: string;

  @ApiProperty({ type: [ProtocolMedicationDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ProtocolMedicationDto)
  medications!: ProtocolMedicationDto[];

  @ApiProperty({ description: 'Duração esperada da etapa', example: '2-4 semanas' })
  @IsString()
  @IsNotEmpty()
  duration!: string;

  @ApiProperty({ description: 'Critérios para avançar para a próxima etapa' })
  @IsString()
  @IsNotEmpty()
  nextStepCriteria!: string;
}

export class InclusionCriterionRuleDto {
  @ApiProperty({ example: 'hba1c' })
  @IsString()
  @IsNotEmpty()
  field!: string;

  @ApiProperty({ example: '>=' })
  @IsString()
  @IsNotEmpty()
  operator!: string;

  @ApiProperty({ example: '7.0' })
  @IsString()
  @IsNotEmpty()
  value!: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  description?: string;
}

export class InclusionCriteriaDto {
  @ApiProperty({ type: [InclusionCriterionRuleDto], description: 'Regras obrigatórias (AND)' })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => InclusionCriterionRuleDto)
  all!: InclusionCriterionRuleDto[];

  @ApiProperty({
    type: [InclusionCriterionRuleDto],
    description: 'Regras alternativas (OR), ao menos uma pode ser atendida',
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => InclusionCriterionRuleDto)
  any!: InclusionCriterionRuleDto[];

  @ApiProperty({ type: [InclusionCriterionRuleDto], description: 'Regras de exclusão' })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => InclusionCriterionRuleDto)
  exclusions!: InclusionCriterionRuleDto[];
}


export class ProtocolReferenceDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  title!: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  source?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  url?: string;
}

export class CreateProtocolDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  name!: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  description!: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  targetCondition!: string;

  @ApiProperty({ example: 'draft' })
  @IsString()
  @IsNotEmpty()
  status!: string;

  @ApiProperty({ type: [ProtocolStepDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ProtocolStepDto)
  steps!: ProtocolStepDto[];

  @ApiProperty({ type: [ProtocolMedicationDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ProtocolMedicationDto)
  medications!: ProtocolMedicationDto[];

  @ApiProperty({ type: InclusionCriteriaDto })
  @IsObject()
  @ValidateNested()
  @Type(() => InclusionCriteriaDto)
  inclusionCriteria!: InclusionCriteriaDto;

  @ApiProperty({ type: [ProtocolReferenceDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ProtocolReferenceDto)
  references!: ProtocolReferenceDto[];
}
