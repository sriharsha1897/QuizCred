import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsOptional, IsString, MaxLength, MinLength } from 'class-validator';
import { EMAIL_MAX_LENGTH, IsAppEmail, normalizeEmail } from '../../common/validation';

export class RegisterDto {
  @ApiProperty({ example: 'user@quiz.com' })
  @Transform(({ value }) => (typeof value === 'string' ? normalizeEmail(value) : value))
  @IsAppEmail()
  @MaxLength(EMAIL_MAX_LENGTH, { message: `Email must be at most ${EMAIL_MAX_LENGTH} characters` })
  email!: string;

  @ApiProperty({ example: 'correct-horse', minLength: 8, maxLength: 72 })
  @IsString({ message: 'Password must be text' })
  @MinLength(8, { message: 'Password must be at least 8 characters' })
  @MaxLength(72, { message: 'Password must be at most 72 characters' })
  password!: string;

  @ApiPropertyOptional({ example: 'Ada', maxLength: 80 })
  @IsOptional()
  @IsString({ message: 'First name must be text' })
  @MinLength(1, { message: 'First name cannot be empty' })
  @MaxLength(80, { message: 'First name must be at most 80 characters' })
  firstName?: string;

  @ApiPropertyOptional({ example: 'Lovelace', maxLength: 80 })
  @IsOptional()
  @IsString({ message: 'Last name must be text' })
  @MinLength(1, { message: 'Last name cannot be empty' })
  @MaxLength(80, { message: 'Last name must be at most 80 characters' })
  lastName?: string;
}
