import { Router } from "express";
import { JobPositionController } from "./jobPositionController";
import { JwtMiddleware } from "../../../middlewares/jwt_middleware";

const jobPositionRoute = Router();

jobPositionRoute.post("/create", [
  JwtMiddleware.verifyToken,
  JwtMiddleware.adminOnly,
  JobPositionController.createJobPosition,
]);

jobPositionRoute.get("/", [
  JwtMiddleware.verifyToken,
  JwtMiddleware.adminOrViewer,
  JobPositionController.getJobPosition,
]);

jobPositionRoute.put("/update", [
  JwtMiddleware.verifyToken,
  JwtMiddleware.adminOnly,
  JobPositionController.updateJobPosition,
]);

jobPositionRoute.delete("/delete", [
  JwtMiddleware.verifyToken,
  JwtMiddleware.adminOnly,
  JobPositionController.deleteJobPosition,
]);

export default jobPositionRoute;
