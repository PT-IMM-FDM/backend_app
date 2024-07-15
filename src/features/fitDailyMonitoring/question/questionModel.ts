import { Question, QuestionAnswer } from "@prisma/client";

export type CreateQuestionRequest = {
  question: string;
  question_answer: string[];
  value: number[];
};

export type GetQuestionResponse = Question[];

export type UpdateQuestionRequest = {
  question_id: number;
  question?: string;
  question_answer_id?: number[];
  question_answer?: string[];
  value?: number[];
  add_question_answer?: string[];
  add_value?: number[];
};

export type UpdateQuestionResponse = UpdateQuestionRequest & {
  old_question?: string;
  old_answer?: string[];
  old_value?: number[];
  new_answer?: string[];
};

export type DeleteQuestionRequest = {
  question_id: number;
};

export type DeleteQuestionResponse = {
  question: string;
};