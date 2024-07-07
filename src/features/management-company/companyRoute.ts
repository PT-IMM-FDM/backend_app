import { Router } from "express";
import { CompanyController } from "./companyController";
import { JwtMiddleware } from "../../middlewares/jwt_middleware";

const companyRoute = Router();

companyRoute.post("/create", [
  JwtMiddleware.verifyToken,
  JwtMiddleware.adminOnly,
  CompanyController.createCompany,
]);

companyRoute.get("/", [
  JwtMiddleware.verifyToken,
  JwtMiddleware.adminOrViewer,
  CompanyController.getCompany,
]);

companyRoute.put("/update", [
  JwtMiddleware.verifyToken,
  JwtMiddleware.adminOnly,
  CompanyController.updateCompany,
]);

companyRoute.delete("/delete", [
  JwtMiddleware.verifyToken,
  JwtMiddleware.adminOnly,
  CompanyController.deleteCompany,
]);

export default companyRoute;
