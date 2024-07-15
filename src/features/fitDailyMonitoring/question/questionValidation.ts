import { z, ZodType } from "zod";

export class QuestionValidation {
  static readonly CREATE_QUESTION: ZodType = z.object({
    question: z.string(),
    question_answer: z.string().array().min(1),
    value: z.number().array().min(1),
  });

  static readonly UPDATE_QUESTION: ZodType = z.object({
    question: z.string(),
    question_id: z.number().optional(),
    question_answer_id: z.number().array().optional(),
    question_answer: z.string().array().optional(),
    value: z.number().array().optional(),
    add_question_answer: z.string().array().optional(),
    add_value: z.number().array().optional(),
    delete_question_answer: z.number().array().optional(),
  });

  static readonly DELETE_QUESTION: ZodType = z.object({
    question_id: z.number(),
  });
}
