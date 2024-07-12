import z, { ZodType } from "zod";

export class EmploymentStatusValidation {
  static readonly CREATE_EMPLOYMENT_STATUS: ZodType = z.object({
    name: z.string().trim().min(1, "Name must not be empty"),
  });

  static readonly UPDATE_EMPLOYMENT_STATUS: ZodType = z.object({
    employment_status_id: z.number().int(),
    new_name: z.string().trim().min(1, "Name must not be empty"),
  });

  static readonly DELETE_EMPLOYMENT_STATUS: ZodType = z.object({
    employment_status_id: z
      .number()
      .int()
      .positive("Employment Status ID must be positive")
      .array(),
  });
}
