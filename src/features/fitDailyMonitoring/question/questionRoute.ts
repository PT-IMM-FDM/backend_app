import { Router } from "express";
import { JwtMiddleware } from "../../../middlewares/jwt_middleware";
import { QuestionController } from "./questionController";

const questionRoute: Router = Router();

questionRoute.post("/create", [
  JwtMiddleware.verifyToken,
  JwtMiddleware.adminOnly,
  QuestionController.createQuestion,
]);
questionRoute.get("/getAll", [
  JwtMiddleware.verifyToken,
  QuestionController.getQuestions,
]);
questionRoute.put("/update", [
  JwtMiddleware.verifyToken,
  JwtMiddleware.adminOnly,
  QuestionController.updateQuestion,
]);
questionRoute.delete("/delete", [
  JwtMiddleware.verifyToken,
  JwtMiddleware.adminOnly,
  QuestionController.deleteQuestion,
]);
questionRoute.get("/form", [
  JwtMiddleware.verifyToken,
  QuestionController.isFilled,
  QuestionController.getForm,
]);

export default questionRoute;
