import { JwtPayload } from "jsonwebtoken";

export interface AdminToken extends JwtPayload {
  user_id: string;
  company_id: string;
  role_id: string;
}

export interface UserToken extends JwtPayload {
  user_id: string;
  company_id: string;
}