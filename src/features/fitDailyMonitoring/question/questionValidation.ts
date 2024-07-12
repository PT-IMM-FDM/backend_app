import { z, ZodType } from "zod";

export class QuestionValidation {
  static readonly CREATE_QUESTION: ZodType = z.object({
    question: z.string(),
  });

  static readonly UPDATE_QUESTION: ZodType = z.object({
    question: z.string(),
    question_id: z.number(),
  });

  static readonly DELETE_QUESTION: ZodType = z.object({
    question_id: z.number(),
  });
}
