import { Router } from "express";
import { JwtMiddleware } from "../../../middlewares/jwt_middleware";
import { ResponseUserController } from "./responseUserController";

const responseUserRoute: Router = Router();

responseUserRoute.post("/create", [
  JwtMiddleware.verifyToken,
  ResponseUserController.createResponseUser,
]);

export default responseUserRoute;
