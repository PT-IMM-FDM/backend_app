import z, { ZodType } from "zod";

export class DepartmentValidation {
  static readonly CREATE_DEPARTMENT: ZodType = z.object({
    name: z.string().trim().min(1, "Name must not be empty"),
  });

  static readonly UPDATE_DEPARTMENT: ZodType = z.object({
    department_id: z.number().int().positive("Department ID must be positive"),
    name: z.string().trim().min(1, "Name must not be empty"),
  });

  static readonly DELETE_DEPARTMENT: ZodType = z.object({
    department_id: z.number().int().positive("Department ID must be positive"),
  });
}
