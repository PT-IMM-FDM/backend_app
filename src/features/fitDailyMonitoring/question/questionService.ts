import { Validation } from "../../../validations";
import { ErrorResponse } from "../../../models";
import { prisma } from "../../../applications";
import { QuestionValidation } from "./questionValidation";
import {
  CreateQuestionRequest,
  CreateQuestionResponse,
  UpdateQuestionRequest,
  UpdateQuestionResponse,
  DeleteQuestionRequest,
  DeleteQuestionResponse,
} from "./questionModel";

export class QuestionService {
  static async createQuestion(
    data: CreateQuestionRequest
  ): Promise<CreateQuestionResponse> {
    const validateData = Validation.validate(
      QuestionValidation.CREATE_QUESTION,
      data
    );

    const createQuestion = await prisma.question.create({
      data: {
        question: validateData.question,
      },
    });

    return createQuestion;
  }

  static async getQuestions(): Promise<CreateQuestionResponse[]> {
    const questions = await prisma.question.findMany({
      where: {
        deleted_at: null,
      },
    });

    if (!questions) {
      throw new ErrorResponse(
        "Questions not found",
        404,
        [],
        "QUESTIONS_NOT_FOUND"
      );
    }
    return questions;
  }

  static async updateQuestion(
    data: UpdateQuestionRequest
  ): Promise<UpdateQuestionResponse> {
    const validateData = Validation.validate(
      QuestionValidation.UPDATE_QUESTION,
      data
    );

    const findQuestion = await prisma.question.findUnique({
      where: {
        question_id: validateData.question_id,
      },
      select: {
        question: true,
      },
    });

    if (!findQuestion) {
      throw new ErrorResponse(
        "Question not found",
        404,
        ["question_id"],
        "QUESTION_NOT_FOUND"
      );
    }

    const updateQuestion = await prisma.question.update({
      where: {
        question_id: validateData.question_id,
      },
      data: {
        question: validateData.question,
      },
    });

    return {
      ...validateData,
      old_question: findQuestion.question,
    };
  }

  static async softDeleteQuestion(
    data: DeleteQuestionRequest
  ): Promise<DeleteQuestionResponse> {
    const validateData = Validation.validate(
      QuestionValidation.DELETE_QUESTION,
      data
    );

    const findQuestion = await prisma.question.findUnique({
      where: {
        question_id: validateData.question_id,
      },
      select: {
        question: true,
      },
    });

    if (!findQuestion) {
      throw new ErrorResponse(
        "Question not found",
        404,
        ["question_id"],
        "QUESTION_NOT_FOUND"
      );
    }

    const softDeleteQuestion = await prisma.question.update({
      where: {
        question_id: validateData.question_id,
      },
      data: {
        deleted_at: new Date(),
      },
    });

    return {
      question: findQuestion.question,
    };
  }
}
