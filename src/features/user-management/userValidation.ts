import { z, ZodType } from "zod";

export class UserValidation {
  static readonly CREATE_USER: ZodType = z.object({
    company_id: z.number(),
    job_position_id: z.number(),
    employment_status_id: z.number(),
    department_id: z.number(),
    full_name: z.string(),
    phone_number: z.string(),
  });

  static readonly LOGIN_USER: ZodType = z.object({
    phone_number: z.string(),
  });

  static readonly DELETE_USER: ZodType = z.object({
    user_id: z.number(),
  });

  static readonly UPDATE_USER: ZodType = z.object({
    user_id: z.number(),
    company_id: z.number().optional(),
    job_position_id: z.number().optional(),
    employment_status_id: z.number().optional(),
    department_id: z.number().optional(),
    full_name: z.string().optional(),
    phone_number: z.string().optional(),
  });
}