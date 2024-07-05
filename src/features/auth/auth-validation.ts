import { z, ZodType } from "zod";

export class AuthValidation {
  static readonly LOGIN_ADMIN: ZodType = z.object({
    email: z.string().email(),
    password: z.string().min(8, "Password must be at least 8 characters"),
  });

  static readonly LOGIN_USER: ZodType = z.object({
    number_phone: z.string(),
    password: z.string(),
  });
}
