export interface AuthUser {
  id?: string;
  name?: string;
  email?: string;
  role?: string;
}

export interface LoginResponse {
  access_token: string;
  token_type?: string;
  user?: AuthUser;
}
