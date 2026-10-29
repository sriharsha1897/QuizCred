import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { ArrayMinSize, IsArray, IsInt, IsUUID, Max, Min, ValidateNested } from 'class-validator';

export class AnswerDto {
  @ApiProperty({ format: 'uuid' })
  @IsUUID('4', { message: 'Each answer must reference a valid question id' })
  questionId!: string;

  @ApiProperty({ example: 1 })
  @IsInt({ message: 'Selected option must be a number' })
  @Min(0, { message: 'Selected option cannot be negative' })
  @Max(5, { message: 'Selected option is out of range' })
  selectedIndex!: number;
}

export class SubmitAttemptDto {
  @ApiProperty({ type: [AnswerDto] })
  @IsArray({ message: 'Answers must be a list' })
  @ArrayMinSize(1, { message: 'Submit at least one answer' })
  @ValidateNested({ each: true })
  @Type(() => AnswerDto)
  answers!: AnswerDto[];
}
