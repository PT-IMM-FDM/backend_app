import z, { ZodType } from "zod";

export class CompanyValidation {
  static readonly CREATE_COMPANY: ZodType = z.object({
    name: z.string().trim().min(1, "Name must not be empty"),
  });

  static readonly UPDATE_COMPANY: ZodType = z.object({
    company_id: z.number().int(),
    new_name: z.string().trim().min(1, "Name must not be empty"),
  });

  static readonly DELETE_COMPANY: ZodType = z.object({
    company_id: z.number().int().positive("Company ID must be positive"),
  });
}
