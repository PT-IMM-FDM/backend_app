import { Router } from "express";
import { JwtMiddleware } from "../../../middlewares/jwt_middleware";
import { ResponseUserController } from "./responseUserController";

const responseUserRoute: Router = Router();

responseUserRoute.post("/create", [
  JwtMiddleware.verifyToken,
  ResponseUserController.createResponseUser,
]);

responseUserRoute.get("/:user_id/:attandance_health_result_id", [
  JwtMiddleware.verifyToken,
  ResponseUserController.getResponseUserById,
]);

export default responseUserRoute;
