import { HttpStatus, Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { User } from '../prisma/types';
import * as bcrypt from 'bcryptjs';
import { AppException } from '../common/errors/app.exception';
import { CreditsService } from '../credits/credits.service';
import { PrismaService } from '../prisma/prisma.service';
import { AuthTokenResponse, AuthUserResponse } from '../common/api';
import { ChangePasswordDto } from './dto/change-password.dto';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { mapAuthUser } from './map-auth-user';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly credits: CreditsService,
  ) {}

  async register(dto: RegisterDto): Promise<AuthTokenResponse> {
    const email = dto.email.trim().toLowerCase();
    const existing = await this.prisma.user.findUnique({ where: { email } });
    if (existing) {
      throw new AppException(
        HttpStatus.CONFLICT,
        'EMAIL_TAKEN',
        'An account with this email already exists',
      );
    }
    const passwordHash = await bcrypt.hash(dto.password, 10);
    const user = await this.prisma.$transaction(async (tx) => {
      const created = await tx.user.create({
        data: {
          email,
          passwordHash,
          role: 'USER',
          firstName: normalizeName(dto.firstName),
          lastName: normalizeName(dto.lastName),
        },
      });
      await this.credits.openAccountWithBonus(tx, created.id);
      return created;
    });
    return this.issue(user);
  }

  async login(dto: LoginDto): Promise<AuthTokenResponse> {
    const email = dto.email.trim().toLowerCase();
    const user = await this.prisma.user.findUnique({ where: { email } });
    const matches = user ? await bcrypt.compare(dto.password, user.passwordHash) : false;
    if (!user || !matches) {
      throw new AppException(
        HttpStatus.UNAUTHORIZED,
        'INVALID_CREDENTIALS',
        'Email or password is incorrect',
      );
    }
    return this.issue(user);
  }

  async profile(userId: string): Promise<AuthUserResponse> {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new AppException(HttpStatus.NOT_FOUND, 'USER_NOT_FOUND', 'User not found');
    }
    return this.toUserResponse(user);
  }

  async updateProfile(userId: string, dto: UpdateProfileDto): Promise<AuthUserResponse> {
    const data: { firstName?: string | null; lastName?: string | null } = {};
    if (dto.firstName !== undefined) {
      data.firstName = normalizeName(dto.firstName);
    }
    if (dto.lastName !== undefined) {
      data.lastName = normalizeName(dto.lastName);
    }
    if (Object.keys(data).length === 0) {
      return this.profile(userId);
    }
    const user = await this.prisma.user.update({
      where: { id: userId },
      data,
    });
    return this.toUserResponse(user);
  }

  async changePassword(userId: string, dto: ChangePasswordDto): Promise<void> {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new AppException(HttpStatus.NOT_FOUND, 'USER_NOT_FOUND', 'User not found');
    }
    const matches = await bcrypt.compare(dto.currentPassword, user.passwordHash);
    if (!matches) {
      throw new AppException(
        HttpStatus.UNAUTHORIZED,
        'INVALID_PASSWORD',
        'Current password is incorrect',
      );
    }
    const passwordHash = await bcrypt.hash(dto.newPassword, 10);
    await this.prisma.user.update({
      where: { id: userId },
      data: { passwordHash },
    });
  }

  private issue(user: User): AuthTokenResponse {
    const accessToken = this.jwt.sign({
      sub: user.id,
      email: user.email,
      role: user.role,
    });
    return {
      accessToken,
      user: this.toUserResponse(user),
    };
  }

  private toUserResponse(user: User): AuthUserResponse {
    return mapAuthUser(user);
  }
}

function normalizeName(value: string | undefined): string | null {
  if (value === undefined) return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}
