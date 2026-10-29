import { AuthUserResponse } from '../common/api';
import { Role } from '../common/enums';

/** DB user fields needed for auth responses (avoids tight coupling to Prisma codegen in the IDE). */
export type AuthUserSource = {
  id: string;
  email: string;
  firstName?: string | null;
  lastName?: string | null;
  role: string;
};

export function mapAuthUser(user: AuthUserSource): AuthUserResponse {
  return {
    id: user.id,
    email: user.email,
    firstName: user.firstName ?? null,
    lastName: user.lastName ?? null,
    role: user.role === Role.ADMIN ? Role.ADMIN : Role.USER,
  };
}
