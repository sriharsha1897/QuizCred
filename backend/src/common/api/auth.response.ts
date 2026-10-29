import { Role } from '../enums';

export interface AuthUserResponse {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  role: Role;
}

export interface AuthTokenResponse {
  accessToken: string;
  user: AuthUserResponse;
}
