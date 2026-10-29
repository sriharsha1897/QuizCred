import { ApiProperty } from '@nestjs/swagger';
import { IsString, MaxLength, MinLength } from 'class-validator';

export class ChangePasswordDto {
  @ApiProperty({ minLength: 8, maxLength: 72 })
  @IsString({ message: 'Current password must be text' })
  @MinLength(8, { message: 'Current password must be at least 8 characters' })
  @MaxLength(72, { message: 'Current password must be at most 72 characters' })
  currentPassword!: string;

  @ApiProperty({ minLength: 8, maxLength: 72 })
  @IsString({ message: 'New password must be text' })
  @MinLength(8, { message: 'New password must be at least 8 characters' })
  @MaxLength(72, { message: 'New password must be at most 72 characters' })
  newPassword!: string;
}
