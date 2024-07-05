import { z, ZodType } from "zod";

export class AuthValidation {
  static readonly LOGIN: ZodType = z.object({
    email: z.string().email().optional(),
    phone_number: z.string(),
    password: z.string().min(8, "Password must be at least 8 characters"),
  });
}
