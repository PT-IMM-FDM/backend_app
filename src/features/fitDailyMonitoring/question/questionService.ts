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
        question_answer: {
          where: {
            deleted_at: null,
          },
        },
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

  static async getForm(user_id: string) {
    const questions = await prisma.question.findMany({
      where: {
        deleted_at: null,
      },
      include: {
        question_answer: {
          where: {
            deleted_at: null,
          },
        },
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

  static async isFilled(user_id: string){
    const isFilled = await prisma.attendanceHealthResult.findFirst({
      where: {
        user_id,
        created_at: {
          gte: new Date(new Date().setHours(0, 0, 0, 0)),
          lte: new Date(new Date().setHours(23, 59, 59, 999)),
        },
      },
    });

    if(isFilled){
      return isFilled;
    }
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

    if (
      validateData.question_answer_id &&
      validateData.question_answer &&
      validateData.value
    ) {
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

    if (validateData.add_question_answer && validateData.add_value) {
      for (let i = 0; i < validateData.add_question_answer.length; i++) {
        await prisma.questionAnswer.create({
          data: {
            question_id: validateData.question_id,
            question_answer: validateData.add_question_answer[i],
            value: validateData.add_value[i],
          },
        });
      }
    }

    if (validateData.delete_question_answer) {
      for (let i = 0; i < validateData.delete_question_answer.length; i++) {
        await prisma.questionAnswer.update({
          where: {
            question_answer_id: validateData.delete_question_answer[i],
          },
          data: {
            deleted_at: new Date(),
          },
        });
      }
    }

    return {
      ...validateData,
      old_question: findQuestion.question,
      old_answer: findQuestionAnswer.map((answer) => answer.question_answer),
      old_value: findQuestionAnswer.map((value) => value.value),
      new_answer: validateData.add_question_answer,
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
