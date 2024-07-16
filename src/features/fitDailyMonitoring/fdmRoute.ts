import { Router, response } from "express";
import { JwtMiddleware } from "../../middlewares/jwt_middleware";
import { questionRoute } from "./question";
import { FdmController } from "./fdmController";
import { responseUserRoute } from "./responseUser";

const fdmRoute = Router();

fdmRoute.use("/question", questionRoute);
fdmRoute.use("/response", responseUserRoute);
fdmRoute.get("/", [FdmController.getFDM]);

export default fdmRoute;
