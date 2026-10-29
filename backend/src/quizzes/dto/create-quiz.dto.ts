import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsString, Max, MaxLength, Min, MinLength } from 'class-validator';

export class CreateQuizDto {
  @ApiProperty({ example: 'World Capitals' })
  @IsString()
  @MinLength(3)
  @MaxLength(120)
  title!: string;

  @ApiProperty({ example: 'Name the capital city.' })
  @IsString()
  @MinLength(1)
  @MaxLength(2000)
  description!: string;

  @ApiProperty({ example: 100, minimum: 1 })
  @IsInt()
  @Min(1)
  @Max(1_000_000)
  stake!: number;

  @ApiProperty({ example: 250, minimum: 1 })
  @IsInt()
  @Min(1)
  @Max(1_000_000)
  reward!: number;

  @ApiProperty({ example: 70, minimum: 0, maximum: 100 })
  @IsInt()
  @Min(0)
  @Max(100)
  passMark!: number;
}
