import { Router } from "express";
import { JwtMiddleware } from "../../middlewares/jwt_middleware";
import { questionRoute } from "./question";
import { FdmController } from "./fdmController";

const fdmRoute = Router();

fdmRoute.use("/question", questionRoute);
fdmRoute.get("/", [FdmController.getFDM]);

export default fdmRoute;