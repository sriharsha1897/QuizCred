import { Body, Controller, Get, HttpCode, Patch, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AuthUser, CurrentUser } from '../common/decorators/current-user.decorator';
import { Public } from '../common/decorators/public.decorator';
import { ResponseMessage } from '../common/decorators/response-message.decorator';
import { AuthTokenResponse, AuthUserResponse } from '../common/api';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { RegisterDto } from './dto/register.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Public()
  @Post('register')
  @ResponseMessage('Account created successfully')
  @ApiOperation({ summary: 'Create a user and open a credit account with 500 credits' })
  register(@Body() dto: RegisterDto): Promise<AuthTokenResponse> {
    return this.auth.register(dto);
  }

  @Public()
  @Post('login')
  @HttpCode(200)
  @ResponseMessage('Login successful')
  @ApiOperation({ summary: 'Exchange email and password for a JWT' })
  login(@Body() dto: LoginDto): Promise<AuthTokenResponse> {
    return this.auth.login(dto);
  }

  @Get('me')
  @ResponseMessage('Profile loaded')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Current user profile' })
  me(@CurrentUser() user: AuthUser): Promise<AuthUserResponse> {
    return this.auth.profile(user.id);
  }

  @Patch('profile')
  @ResponseMessage('Profile updated')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update first and last name' })
  updateProfile(
    @CurrentUser() user: AuthUser,
    @Body() dto: UpdateProfileDto,
  ): Promise<AuthUserResponse> {
    return this.auth.updateProfile(user.id, dto);
  }

  @Post('change-password')
  @HttpCode(200)
  @ResponseMessage('Password changed')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Change password using the current password' })
  changePassword(@CurrentUser() user: AuthUser, @Body() dto: ChangePasswordDto): Promise<void> {
    return this.auth.changePassword(user.id, dto);
  }
}
