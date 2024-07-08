import { Router } from "express";
import { EmploymentStatusController } from "./employmentStatusController";
import { JwtMiddleware } from "../../../middlewares/jwt_middleware";

const employmentStatusRoute = Router();

employmentStatusRoute.post("/create", [
  JwtMiddleware.verifyToken,
  JwtMiddleware.adminOnly,
  EmploymentStatusController.createEmploymentStatus,
]);

employmentStatusRoute.get("/", [
  JwtMiddleware.verifyToken,
  JwtMiddleware.adminOrViewer,
  EmploymentStatusController.getEmploymentStatus,
]);

employmentStatusRoute.put("/update", [
  JwtMiddleware.verifyToken,
  JwtMiddleware.adminOnly,
  EmploymentStatusController.updateEmploymentStatus,
]);

employmentStatusRoute.delete("/delete", [
  JwtMiddleware.verifyToken,
  JwtMiddleware.adminOnly,
  EmploymentStatusController.deleteEmploymentStatus,
]);

export default employmentStatusRoute;
