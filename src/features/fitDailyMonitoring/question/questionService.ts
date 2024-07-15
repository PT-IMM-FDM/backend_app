import { Validation } from "../../../validations";
import { ErrorResponse } from "../../../models";
import { prisma } from "../../../applications";
import { QuestionValidation } from "./questionValidation";
import {
  CreateQuestionRequest,
  GetQuestionResponse,
  UpdateQuestionRequest,
  UpdateQuestionResponse,
  DeleteQuestionRequest,
  DeleteQuestionResponse,
} from "./questionModel";

export class QuestionService {
  static async createQuestion(data: CreateQuestionRequest) {
    const validateData = Validation.validate(
      QuestionValidation.CREATE_QUESTION,
      data
    );
    await prisma.$transaction(async (prisma) => {
      const createQuestion = await prisma.question.create({
        data: {
          question: validateData.question,
          question_answer: {
            createMany: {
              data: validateData.question_answer.map((answer, index) => ({
                question_answer: answer,
                value: validateData.value[index],
              })),
            },
          },
        },
      });
    });
  }

  static async getQuestions(): Promise<GetQuestionResponse> {
    const questions = await prisma.question.findMany({
      where: {
        deleted_at: null,
      },
      include: {
        question_answer: true,
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

    const findQuestionAnswer = await prisma.questionAnswer.findMany({
      where: {
        question_id: validateData.question_id,
      },
      select: {
        question_answer_id: true,
        question_answer: true,
        value: true,
      },
    });

    if (validateData.question_answer_id && validateData.question_answer && validateData.value) {
      for (let i = 0; i < validateData.question_answer_id.length; i++) {
        await prisma.questionAnswer.update({
          where: {
            question_answer_id: validateData.question_answer_id[i],
          },
          data: {
            question_answer: validateData.question_answer[i],
            value: validateData.value[i],
          },
        });
      }
    }
    return {
      ...validateData,
      old_question: findQuestion.question,
      old_answer: findQuestionAnswer.map((answer) => answer.question_answer),
      old_value: findQuestionAnswer.map((value) => value.value),
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
        question_answer: {
          updateMany: {
            where: {
              question_id: validateData.question_id,
            },
            data: {
              deleted_at: new Date(),
            },
          },
        },
      },
    });

    return {
      question: findQuestion.question,
    };
  }
}