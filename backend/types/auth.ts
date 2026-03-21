import type { JwtPayload } from 'jsonwebtoken';

export interface User {
  id: number;
  user_id: string;
  email: string;
  password: string;
  name: string;
  created_at: Date;
}

export interface AuthJwtPayload extends JwtPayload {
  user_id: string;
}

export interface LoginBody {
  email: string;
  password: string;
}
