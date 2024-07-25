import { Request, Response, NextFunction } from "express";
import { QuestionService } from "./questionService";

export class QuestionController {
  static async createQuestion(req: Request, res: Response, next: NextFunction) {
    try {
      const { question, question_answer, value } = req.body;
      const createQuestion = await QuestionService.createQuestion({
        question,
        question_answer,
        value,
      });
      return res.status(200).json({
        success: true,
        data: createQuestion,
        message: "Question created successfully",
      });
    } catch (error) {
      next(error);
    }
  }
  // For admin
  static async getQuestions(req: Request, res: Response, next: NextFunction) {
    try {
      const getQuestions = await QuestionService.getQuestions();
      return res.status(200).json({
        success: true,
        data: getQuestions,
        message: "Get All questions successfully",
      });
    } catch (error) {
      next(error);
    }
  }
  // for user
  static async getForm(req: Request, res: Response, next: NextFunction) {
    try {
      const { user_id } = res.locals.user;
      const getForm = await QuestionService.getForm(user_id);
      return res.status(200).json({
        success: true,
        data: getForm,
        message: "Get form successfully",
      });
    } catch (error) {
      next(error);
    }
  }

  static async isFilled(req: Request, res: Response, next: NextFunction) {
    try {
      const { user_id } = res.locals.user;
      const isFilled = await QuestionService.isFilled(user_id);
      if (isFilled !== undefined) {
        return res.status(200).json({
          success: true,
          data: isFilled,
          message: "Form has been filled today",
        });
      } else {
        next()
      }
    } catch (error) {
      next(error);
    }
  }

  static async updateQuestion(req: Request, res: Response, next: NextFunction) {
    try {
      const {
        question_id,
        question,
        question_answer_id,
        question_answer,
        value,
        add_question_answer,
        add_value,
        delete_question_answer,
      } = req.body;
      const updateQuestion = await QuestionService.updateQuestion({
        question_id,
        question,
        question_answer_id,
        question_answer,
        value,
        add_question_answer,
        add_value,
        delete_question_answer,
      });
      return res.status(200).json({
        success: true,
        data: updateQuestion,
        message: "Question updated successfully",
      });
    } catch (error) {
      next(error);
    }
  }

  static async deleteQuestion(req: Request, res: Response, next: NextFunction) {
    try {
      const { question_id } = req.body;
      const deleteQuestion = await QuestionService.softDeleteQuestion({
        question_id,
      });
      return res.status(200).json({
        success: true,
        data: deleteQuestion,
        message: "Question deleted successfully",
      });
    } catch (error) {
      next(error);
    }
  }
}
