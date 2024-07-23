import z, { ZodType } from "zod";

export class DocumentValidation {
  static readonly GET_DOCUMENT_LIST_USER: ZodType = z.object({
    date_from: z.date().optional(),
    date_to: z.date().optional(),
  });

  static readonly GET_DATA_FDM: ZodType = z.object({
    result: z.enum(["FIT", "FIT_FOLLOW_UP", "UNFIT"]).optional(),
    customDateFrom: z.date().optional(),
    customDateTo: z.date().optional(),
    user_id: z.string().optional(),
    job_position_name: z.string().array().optional(),
    department_name: z.string().array().optional(),
    company_name: z.string().array().optional(),
    employment_status_name: z.string().array().optional(),
  });
}
