import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength } from 'class-validator';

export class UpdateProfileDto {
  @ApiPropertyOptional({ example: 'Ada', maxLength: 80 })
  @IsOptional()
  @IsString({ message: 'First name must be text' })
  @MaxLength(80, { message: 'First name must be at most 80 characters' })
  firstName?: string;

  @ApiPropertyOptional({ example: 'Lovelace', maxLength: 80 })
  @IsOptional()
  @IsString({ message: 'Last name must be text' })
  @MaxLength(80, { message: 'Last name must be at most 80 characters' })
  lastName?: string;
}
