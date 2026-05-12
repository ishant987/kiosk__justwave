import type { Branch } from './branch';

export interface AuthUser {
  id?: string;
  name?: string;
  email?: string;
  role?: string;
  location_id?: string;
  location_name?: string;
  branch_id?: string;
  branch_name?: string;
  location?: Branch;
  branch?: Branch;
}

export interface LoginResponse {
  access_token: string;
  token_type?: string;
  user?: AuthUser;
}
