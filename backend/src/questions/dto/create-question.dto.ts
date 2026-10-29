import { ApiProperty } from '@nestjs/swagger';
import { ArrayMaxSize, ArrayMinSize, IsArray, IsInt, IsString, Max, MaxLength, Min, MinLength } from 'class-validator';

export class CreateQuestionDto {
  @ApiProperty({ example: 'What is the capital of France?' })
  @IsString()
  @MinLength(3)
  @MaxLength(500)
  prompt!: string;

  @ApiProperty({ example: ['Lyon', 'Paris', 'Nice', 'Marseille'] })
  @IsArray()
  @ArrayMinSize(2)
  @ArrayMaxSize(6)
  @IsString({ each: true })
  @MinLength(1, { each: true })
  @MaxLength(200, { each: true })
  options!: string[];

  @ApiProperty({ example: 1, description: 'Zero-based index of the correct option' })
  @IsInt()
  @Min(0)
  @Max(5)
  correctIndex!: number;

  @ApiProperty({ example: 1 })
  @IsInt()
  @Min(1)
  @Max(200)
  order!: number;
}
