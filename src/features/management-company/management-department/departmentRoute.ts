import { Router } from "express";
import { DepartmentController } from "./departmentController";
import { JwtMiddleware } from "../../../middlewares/jwt_middleware";

const departmentRoute = Router();

departmentRoute.post("/create", [
  JwtMiddleware.verifyToken,
  JwtMiddleware.adminOnly,
  DepartmentController.createDepartment,
]);

departmentRoute.get("/", [
  JwtMiddleware.verifyToken,
  JwtMiddleware.adminOrViewer,
  DepartmentController.getDepartment,
]);

departmentRoute.put("/update", [
  JwtMiddleware.verifyToken,
  JwtMiddleware.adminOnly,
  DepartmentController.updateDepartment,
]);

departmentRoute.delete("/delete", [
  JwtMiddleware.verifyToken,
  JwtMiddleware.adminOnly,
  DepartmentController.deleteDepartment,
]);

export default departmentRoute;