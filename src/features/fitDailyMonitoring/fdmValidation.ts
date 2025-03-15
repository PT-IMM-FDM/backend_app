import z, { ZodType } from "zod";

export class FDMValidation {
  static readonly GET_FDM: ZodType = z.object({
    adminUserId: z.string(),
    startDate: z.date().optional(),
    endDate: z.date().optional(),
    name: z.string().optional(),
    user_id: z.string().optional(),
    company_id: z.number().array().optional(),
    job_position_id: z.number().array().optional(),
    department_id: z.number().array().optional(),
    employment_status_id: z.number().array().optional(),
    result: z.enum(["FIT", "FIT_FOLLOW_UP", "UNFIT"]).optional(),
  });

  static readonly MY_FDM: ZodType = z.object({
    startDate: z.date().optional(),
    endDate: z.date().optional(),
    user_id: z.string(),
  });

  static readonly COUNT_RESULT: ZodType = z.object({
    admin_user_id: z.string(),
    startDate: z.date().optional(),
    endDate: z.date().optional(),
    user_id: z.string().array().optional(),
    company_id: z.number().array().optional(),
    job_position_id: z.number().array().optional(),
    department_id: z.number().array().optional(),
    employment_status_id: z.number().array().optional(),
  });

  static readonly COUNT_FILLED_TODAY: ZodType = z.object({
    admin_user_id: z.string(),
    job_position_id: z.number().array().optional(),
    employment_status_id: z.number().array().optional(),
    department_id: z.number().array().optional(),
    company_id: z.number().array().optional(),
  });

  static readonly WHO_FILLED_TODAY: ZodType = z.object({
    admin_user_id: z.string(),
    job_position_id: z.number().array().optional(),
    employment_status_id: z.number().array().optional(),
    department_id: z.number().array().optional(),
    company_id: z.number().array().optional(),
  });

  static readonly ADD_ATTACHMENT_FILE: ZodType = z.object({
    attendance_health_result_id: z.number(),
  });

  static readonly DELETE_ATTACHMENT_FILE: ZodType = z.object({
    attendance_health_result_id: z.number(),
    attendance_health_file_attachment_id: z.number(),
  });

  static readonly ADD_NOTE : ZodType = z.object({
    attendance_health_result_id: z.number(),
    note: z.string().max(255),
  });

  static readonly MOST_QUESTION_ANSWERED: ZodType = z.object({
    admin_user_id: z.string(),
    company_id: z.number().array().optional(),
    job_position_id: z.number().array().optional(),
    department_id: z.number().array().optional(),
    employment_status_id: z.number().array().optional(),
  });
}
