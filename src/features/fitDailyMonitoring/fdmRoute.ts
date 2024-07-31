import { Router, response } from "express";
import { JwtMiddleware } from "../../middlewares/jwt_middleware";
import { questionRoute } from "./question";
import { FdmController } from "./fdmController";
import { responseUserRoute } from "./responseUser";

const fdmRoute = Router();

fdmRoute.use("/question", questionRoute);
fdmRoute.use("/response", responseUserRoute);
fdmRoute.get("/", [
  JwtMiddleware.verifyToken,
  JwtMiddleware.adminOrViewer,
  FdmController.getFDM,
]);
fdmRoute.get("/me", [
  JwtMiddleware.verifyToken,
  FdmController.getMyFDM,
]);
fdmRoute.get("/countResult", [
  JwtMiddleware.verifyToken,
  JwtMiddleware.adminOrViewer,
  FdmController.countResult,
]);
fdmRoute.get("/countFilledToday", [
  JwtMiddleware.verifyToken,
  JwtMiddleware.adminOrViewer,
  FdmController.countFilledToday,
]);
fdmRoute.get("/usersNotFilledToday", [
  JwtMiddleware.verifyToken,
  JwtMiddleware.adminOrViewer,
  FdmController.getUsersNotFilledToday,
]);

export default fdmRoute;
