import { JwtPayload } from "jsonwebtoken";

export interface UserToken extends JwtPayload {
  user_id: string;
  company_id: string;
  role_id: number;
}