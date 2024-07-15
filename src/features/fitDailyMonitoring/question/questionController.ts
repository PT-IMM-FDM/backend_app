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

  static async updateQuestion(req: Request, res: Response, next: NextFunction) {
    try {
      const { question_id, question, question_answer_id, question_answer, value } = req.body;
      const updateQuestion = await QuestionService.updateQuestion({
        question_id,
        question,
        question_answer_id,
        question_answer,
        value,
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
