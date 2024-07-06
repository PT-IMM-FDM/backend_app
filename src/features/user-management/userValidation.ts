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
    birth_date: z.date()
  });

  static readonly GET_USER: ZodType = z.object({
    company_name: z.string().optional(),
    job_position: z.string().optional(),
    employment_status: z.string().optional(),
    department: z.string().optional(),
    name: z.string().optional(),
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
    phone_number: z.string().optional(),
    email: z.string().optional(),
    birth_date: z.date().optional(),
  });
}