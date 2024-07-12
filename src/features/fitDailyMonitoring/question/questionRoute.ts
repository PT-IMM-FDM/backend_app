import { Router } from "express";
import { JwtMiddleware } from "../../../middlewares/jwt_middleware";
import { QuestionController } from "./questionController";

const questionRoute: Router = Router();

questionRoute.post("/question/create", [
  JwtMiddleware.verifyToken,
  QuestionController.createQuestion,
]);
questionRoute.get("/question/getAll", [
  JwtMiddleware.verifyToken,
  QuestionController.getQuestions,
]);
questionRoute.put("/question/update", [
  JwtMiddleware.verifyToken,
  QuestionController.updateQuestion,
]);
questionRoute.delete("/question/delete", [
  JwtMiddleware.verifyToken,
  QuestionController.deleteQuestion,
]);

export default questionRoute;
