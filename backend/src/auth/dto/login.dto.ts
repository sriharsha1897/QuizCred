import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsString, MaxLength, MinLength } from 'class-validator';
import { EMAIL_MAX_LENGTH, IsAppEmail, normalizeEmail } from '../../common/validation';

export class LoginDto {
  @ApiProperty({ example: 'user@quiz.com' })
  @Transform(({ value }) => (typeof value === 'string' ? normalizeEmail(value) : value))
  @IsAppEmail()
  @MaxLength(EMAIL_MAX_LENGTH, { message: `Email must be at most ${EMAIL_MAX_LENGTH} characters` })
  email!: string;

  @ApiProperty({ example: 'correct-horse' })
  @IsString({ message: 'Password must be text' })
  @MinLength(8, { message: 'Password must be at least 8 characters' })
  @MaxLength(72, { message: 'Password must be at most 72 characters' })
  password!: string;
}
