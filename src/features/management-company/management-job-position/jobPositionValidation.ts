import z, { ZodType } from "zod";

export class JobPositionValidation {
  static readonly CREATE_JOB_POSITION: ZodType = z.object({
    name: z.string().trim().min(1, "Name must not be empty"),
  });

  static readonly UPDATE_JOB_POSITION: ZodType = z.object({
    job_position_id: z.number().int(),
    new_name: z.string().trim().min(1, "Name must not be empty"),
  });

  static readonly DELETE_JOB_POSITION: ZodType = z.object({
    job_position_id: z
      .number()
      .int()
      .positive("Job Position ID must be positive")
      .array(),
  });
}
