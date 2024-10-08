import { z, ZodType } from "zod";

export class UserValidation {
  static readonly CREATE_USER: ZodType = z.object({
    company_id: z.number(),
    job_position_id: z.number(),
    employment_status_id: z.number(),
    department_id: z.number(),
    role_id: z.number(),
    full_name: z.string(),
    phone_number: z.string(),
    email: z.string().optional(),
    birth_date: z.date(),
  });

  static readonly GET_USER: ZodType = z.object({
    company_name: z.string().optional(),
    job_position: z.string().optional(),
    employment_status: z.string().optional(),
    department: z.string().optional(),
    name: z.string().optional(),
    is_active: z.boolean().optional(),
  });

  static readonly DELETE_USER: ZodType = z.object({
    user_id: z.array(z.string()),
  });

  static readonly UPDATE_USER: ZodType = z.object({
    user_id: z.string(),
    company_id: z.number().optional(),
    job_position_id: z.number().optional(),
    employment_status_id: z.number().optional(),
    role_id: z.number().optional(),
    department_id: z.number().optional(),
    full_name: z.string().optional(),
    phone_number: z.string().min(5).optional(),
    email: z.string().optional(),
    birth_date: z.date().optional(),
    is_active: z.boolean().optional(),
    get_notification: z.boolean().optional(),
  });
  
  static readonly UPDATE_PASSWORD: ZodType = z.object({
    old_password: z.string().min(8, "Password must be at least 8 characters").max(20, "Max password length is 20 characters"),
    new_password: z.string().min(8, "Password must be at least 8 characters").max(20, "Max password length is 20 characters"),
  });

  static readonly RESET_PASSWORD: ZodType = z.object({
    user_id: z.string(),
  });
}
