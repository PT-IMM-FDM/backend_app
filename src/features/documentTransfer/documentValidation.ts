import z, { ZodType } from "zod";

export class DocumentValidation {
  static readonly GET_DOCUMENT_LIST_USER: ZodType = z.object({
    date_from: z.date().optional(),
    date_to: z.date().optional(),
  });
}
