import z, { ZodType } from "zod";

export class FDMValidation {
  static readonly GET_FDM: ZodType = z.object({
    dateFilter: z.enum(["7", "30", "90", "365", "custom"]).optional(),
    customDateFrom: z.date().optional(),
    customDateTo: z.date().optional(),
    user_id: z.string().optional(),
    department_name: z.string().optional(),
    employment_status_name: z.string().optional(),
    result: z.enum(["FIT", "FIT_FOLLOW_UP", "UNFIT"]).optional(),
  });
}