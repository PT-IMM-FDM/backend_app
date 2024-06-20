import { JwtPayload } from "jsonwebtoken";

export interface AdminToken extends JwtPayload {
  user_id: string;
  phone_number: string;
}

export interface UserToken extends JwtPayload {
  user_id: string;
  phone_number: string;
}