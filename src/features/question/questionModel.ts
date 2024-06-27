import { Question } from "@prisma/client";

export type CreateQuestionRequest = {
  question: string;
};

export type CreateQuestionResponse = Question;

export type GetQuestionResponse = Question[];

export type UpdateQuestionRequest = {
  question_id: number;
  question: string;
};

export type UpdateQuestionResponse = UpdateQuestionRequest & {
  old_question: string;
};

export type DeleteQuestionRequest = {
  question_id: number;
};

export type DeleteQuestionResponse = {
  question: string;
};
