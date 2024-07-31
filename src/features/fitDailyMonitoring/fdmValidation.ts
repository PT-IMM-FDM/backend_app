import z, { ZodType } from "zod";

export class FDMValidation {
  static readonly GET_FDM: ZodType = z.object({
    startDate: z.date().optional(),
    endDate: z.date().optional(),
    user_id: z.string().optional(),
    company_id: z.number().array().optional(),
    job_position_id: z.number().array().optional(),
    department_id: z.number().array().optional(),
    employment_status_id: z.number().array().optional(),
    result: z.enum(["FIT", "FIT_FOLLOW_UP", "UNFIT"]).optional(),
  });

  static readonly COUNT_RESULT: ZodType = z.object({
    startDate: z.date().optional(),
    endDate: z.date().optional(),
    user_id: z.string().array().optional(),
    company_id: z.number().array().optional(),
    job_position_id: z.number().array().optional(),
    department_id: z.number().array().optional(),
    employment_status_id: z.number().array().optional(),
  });

  static readonly COUNT_FILLED_TODAY: ZodType = z.object({
    job_position_id: z.number().array().optional(),
    employment_status_id: z.number().array().optional(),
    department_id: z.number().array().optional(),
    company_id: z.number().array().optional(),
  });

  static readonly WHO_FILLED_TODAY: ZodType = z.object({
    job_position_id: z.number().array().optional(),
    employment_status_id: z.number().array().optional(),
    department_id: z.number().array().optional(),
    company_id: z.number().array().optional(),
  });
}
